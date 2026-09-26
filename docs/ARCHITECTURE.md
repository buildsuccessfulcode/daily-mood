# Arsitektur

## 1. Gambaran Umum

```
                         +---------------------------+
   Vercel Cron           |        Browser            |
   (00:00 & 01:00 WIB)   |                           |
        |                |  /        Landing + Card  |
        v                |  /admin   Dashboard       |
  /api/cron/generate     +------------+--------------+
  /api/cron/cleanup                   |
        |                Server Actions|    RSC fetch
        |                (mutasi)      |    (baca publik)
        v                             v
  +-------------------------------------------------+
  |        Next.js Server (Vercel, Node runtime)    |
  |  app/actions.ts        (service role + auth)    |
  |  app/api/cron/*        (CRON_SECRET)            |
  |  lib/auth.ts           (scrypt + HMAC cookie)   |
  |  lib/crypto.ts         (AES-256-GCM AI key)     |
  +------------------------+------------------------+
                           |
                           v
  +-------------------------------------------------+
  |                    Supabase                     |
  |  Postgres + RLS                                 |
  |  categories (read) | quotes (read)              |
  |  admins (private)  | app_settings (private)     |
  +-------------------------------------------------+
```

- **Baca publik** (kategori + quote) lewat anon key dengan RLS `SELECT`.
- **Tulis & data sensitif** hanya lewat server (service role). AI key & admin tidak punya
  policy RLS, jadi tidak bisa dibaca anon.
- **Cron** menulis quote baru lalu menghapus quote lebih tua dari 7 hari.

## 2. Alur Quote Harian

```
Cron 00:00 WIB -> GET /api/cron/generate
  -> verifikasi Bearer CRON_SECRET
  -> baca gemini_api_key (decrypt AES-256-GCM)
  -> ambil 10 quote terakhir per kategori sebagai daftar "hindari mirip"
  -> untuk tiap kategori aktif: Gemini generate 1 quote (gaya viral + temperature 1.15)
  -> insert ke quotes (snapshot gradient + icon)

User buka "/"
  -> server component ambil kategori aktif + quote 7 hari terakhir (cutoff WIB)
  -> lib/quotes.groupQuotesByDay() grup per tanggal Asia/Jakarta
  -> pickLatestPerCategory() pilih quote terbaru tiap kategori per hari
  -> <DailyMood> render chip hari + tab kategori + <QuoteCard>
  -> tombol unduh -> html-to-image toPng (pixelRatio 3) -> PNG 3:4 + watermark
```

## 3. Autentikasi Admin

```
POST login (server action)
  -> rate limit in-memory per IP (best effort)
  -> SELECT admins by username (service role)
  -> scrypt verify password
  -> buat token: base64url("adminId.expiry") + "." + HMAC-SHA256(ADMIN_SESSION_SECRET)
  -> set cookie HttpOnly, SameSite=Lax, Secure (produksi), maxAge 12 jam

Request ke /admin/*
  -> (protected)/layout.tsx panggil requireAdmin()
  -> verify tanda tangan + expiry token; gagal -> redirect /admin/login
```

Sesi bersifat stateless (tidak ada tabel sesi). Logout cukup hapus cookie.

## 4. Enkripsi AI Key

- `APP_ENCRYPTION_KEY` = 32 byte (base64) di env. Hanya di server.
- `lib/crypto.ts` memakai AES-256-GCM: output `v1:<base64(iv[12] + tag[16] + ciphertext)>`.
- Nilai disimpan di `app_settings.value`. Client hanya menerima status "terisi" + 4 akhir.
- Admin bisa mengganti key kapan saja; generate berikutnya memakai key baru.

## 5. Struktur Kode

Prinsip: **logika murni** (`lib/quotes.ts`) dipisah dari **I/O** (`lib/supabase`, `lib/gemini`)
dan **presentasi** (komponen). Validasi input ada di `app/actions.ts` & route cron.

## 6. Keputusan Desain

1. **Server Actions, bukan REST** untuk semua mutasi. Route handler hanya untuk cron.
2. **Kategori dinamis** agar admin tidak perlu ubah skema untuk mengelola konten.
3. **Snapshot gradient/icon di quotes** supaya tampilan quote lama stabil walau kategori diubah.
4. **Retensi 7 hari** supaya DB kecil dan konten tetap segar (0 MB media storage).
5. **Pemilihan quote berbasis tanggal** (`created_at` zona Asia/Jakarta) supaya 1 hari = 1 quote terbaru per kategori, dan riwayat 7 hari bisa dilihat ulang.
6. **Best-effort rate limit** di memori (serverless: per-instance). Cukup untuk mencegah brute force ringan.

## 7. Batasan Kuota (Free Tier)

- Tidak ada realtime, tidak ada polling.
- Query landing dibatasi 7 hari terakhir dan hanya kategori aktif.
- Cron 2x/hari; tiap kategori 1 panggilan Gemini (4 panggilan/hari).

## 8. Autentikasi Pengguna & Journal

Dua sistem auth terpisah: **admin** (custom, cookie `dm_admin`) dan **pengguna**
(Supabase Auth via `@supabase/ssr`, cookie Supabase). Login pengguna **hanya
Google**; registrasi manual tidak ada.

```
User klik "Masuk dengan Google"
  -> server action signInWithGoogleAction -> Supabase signInWithOAuth (return URL)
  -> browser redirect ke Google -> Supabase /auth/v1/callback
  -> balik ke /auth/callback?code=... -> exchangeCodeForSession (set cookie)
  -> profil belum punya nickname?
       -> generateUniqueNickname(deriveNickname(user))  (dari nama/email Google)
  -> /journal

User buka /journal
  -> requireUserPage("/journal") -> getCurrentUser (Supabase getUser)
  -> getTodayJournal + getJournalHistory (RLS: auth.uid() = user_id)
  -> belum ada entri -> <JournalForm>
  -> sudah ada       -> <JournalEntryCard> + <AIResponseCard> + kalender
```

`proxy.ts` (pengganti `middleware` di Next 16) hanya me-refresh sesi Supabase di
setiap request sebagai optimistic check. Semua otorisasi data tetap dicek di
server (server action / data layer), bukan hanya di proxy.

## 9. Alur Submit Journal

```
JournalForm submit -> submitJournalAction (server)
  1. user dari sesi (bukan dari client)
  2. validasi mood + 20-500 kata (lib/journal.ts)
  3. journal_date = dateKey() zona Asia/Jakarta (bukan UTC / CURRENT_DATE)
  4. bila entri hari ini sudah ada -> tolak
  5. baca AI key terenkripsi (service role) + model, panggil generateJournalResponse
  6. insert ke user_journals (RLS check auth.uid() = user_id)
  7. tangani unique (user_id, journal_date) -> pesan "sudah menulis hari ini"
```


# CONTEXT — Daily Mood

> File ini untuk agen AI. Baca ini dulu sebelum menelusuri repo. Jaga tetap ringkas.

## Tujuan

**Daily Mood**: web app harian untuk semua. Menampilkan 1 quote harian per kategori
(Gen Z / relatable), bisa diunduh jadi kartu PNG 3:4 dengan watermark yang bisa diatur
admin, untuk dibagikan ke WA Status / IG Story / TikTok. Konten diisi otomatis oleh
Gemini lewat cron.

PRD lengkap: `spesifikasi_pengembangan_daily_mood.md` (root). Beberapa detail
sudah disesuaikan (lihat "Perbedaan dari PRD" di bawah).

Fitur tambahan: **AI Daily Journal** (1 entri/hari, login Supabase Auth, balasan
Gemini). Konsep awal di `JOURNAL_PRD.md` (root).

## Stack & Konvensi

- Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4.
- **Next 16 async:** selalu `await params`, `await searchParams`, `await cookies()`, `await headers()`.
- `middleware` diganti `proxy` (tidak dipakai di sini; security headers via `next.config.ts`).
- Tipe global: `PageProps<'/path'>`, `LayoutProps<'/path'>`, `RouteContext<'/path'>`.
- UI Bahasa Indonesia. **Tanpa komentar kode** kecuali diminta. Tanpa emoji di kode.
- Font `Plus Jakarta Sans` via `next/font/google`.
- Supabase Postgres. Anon key hanya `SELECT` (RLS); semua tulis lewat service role di server.
- AI: `@google/genai`, model `gemini-2.5-flash`.

## Perbedaan dari PRD (sengaja)

1. Kategori **dinamis** (tabel `categories`), bukan enum tetap, agar admin bisa CRUD.
2. Retensi cleanup **7 hari** (sesuai PRD), ditampilkan sebagai riwayat 7 hari.
3. AI key **disimpan terenkripsi** di DB (AES-256-GCM), bukan hanya env. Env hanya
   menyimpan `APP_ENCRYPTION_KEY`.
4. Admin auth: password scrypt + cookie sesi bertanda tangan (HMAC), bukan password env.
5. Tidak ada demo mode; Supabase wajib.
6. **Journal** memakai **Supabase Auth** (`@supabase/ssr`) dengan **login Google saja**
   (registrasi manual dihapus). Route `/journal`, `/login`, `/profile`, dan
   `/auth/callback`. Admin tetap memakai auth custom lama.
7. `journal_date` dihitung di app zona `Asia/Jakarta` (`dateKey()`), **bukan**
   `CURRENT_DATE`/UTC. 1 entri/hari dijaga `unique (user_id, journal_date)`.
8. **Nickname wajib unik** (case-insensitive). User Google baru dibuatkan nickname
   otomatis dari nama/email Google (`generateUniqueNickname`) dan bisa diubah di
   `/profile`. Avatar Google di-hotlink (0 storage).

## Peta File

```
app/
  layout.tsx                 root layout (font, metadata)
  globals.css                Tailwind v4 + token warna
  page.tsx                   landing (server): ambil quote harian -> <DailyMood>
  actions.ts                 server actions admin (satu-satunya jalur tulis admin)
  auth/actions.ts            server actions auth user (Google sign-in, sign-out)
  auth/callback/route.ts     exchange code OAuth -> auto nickname unik -> redirect
  journal/page.tsx           halaman journal (server): guard + entri hari ini + kalender
  journal/actions.ts         submitJournalAction (Gemini + insert 1/hari)
  login/page.tsx             halaman login (Google saja)
  profile/page.tsx           halaman profil (nickname, email, avatar)
  profile/actions.ts         updateProfileAction
  admin/                     login + dashboard + quotes (protected)
  api/cron/*                 route cron generate & cleanup quote
proxy.ts                     refresh sesi Supabase (pengganti middleware Next 16)
components/
  SiteHeader.tsx             nav Quote/Journal + akun/avatar + logout
  MobileMenu.tsx             menu mobile (hamburger): nav + akun + keluar
  auth/LoginForm.tsx         tombol Masuk dengan Google (Google-only)
  journal/JournalForm.tsx    mood picker + textarea + word counter
  journal/JournalEntryCard.tsx       tampilan entri + lock
  journal/AIResponseCard.tsx kartu balasan AI
  journal/MoodCalendar.tsx   30 hari mood
  journal/ResetCountdown.tsx hitung mundur reset 00:00 WIB
  profile/Avatar.tsx         avatar Google / inisial
  profile/ProfileForm.tsx    edit nickname
  DailyMood.tsx, QuoteCard.tsx, Logo.tsx, CategoryIcon.tsx, admin/*, ui/Toast.tsx
lib/
  auth-user.ts               getCurrentUser (cache), requireUserPage, safeNextPath
  journal.ts                 murni: countWords, validateEntry, nextResetWIB
  journal-data.ts            getTodayJournal, getJournalHistory (RLS)
  profile-data.ts            getProfile, greetingName, isNicknameTaken,
                             deriveNickname, generateUniqueNickname
  config.ts, constants.ts, crypto.ts, auth.ts (admin), gemini.ts, generate.ts,
  quotes.ts, data.ts, types.ts, utils.ts
  supabase/client.ts         browser anon (baca publik)
  supabase/server.ts         service role + anon server
  supabase/auth-server.ts    Supabase Auth SSR (cookie)
supabase/
  schema.sql                 skema + RLS + index + trigger profil
  seed.sql                   kategori default + admin awal (hash, bukan plaintext)
docs/                        dokumentasi
vercel.json                  jadwal cron
```

## Tabel Penting

- `categories`: `key` unik (SADVIBES/RANDOM/MANIFEST/REALTALK), `label`, `icon_name`,
  `theme_gradient`, `prompt`, `sort_order`, `is_active`.
- `quotes`: `category_id`, `text`, snapshot `theme_gradient` + `icon_name`, `created_at`.
- `admins`: `username` unik, `password_hash` (format `scrypt:N:r:p:saltB64:hashB64`).
- `app_settings`: key-value; `gemini_api_key` disimpan sebagai ciphertext, `watermark`
  disimpan plaintext dan dibaca server untuk kartu publik.
- `user_journals`: `user_id` FK `auth.users`, `journal_date` (WIB), `mood` (enum),
  `entry_text`, `ai_response`, `unique (user_id, journal_date)`; RLS milik sendiri.
- `profiles`: `id` FK `auth.users`, `nickname` (unik case-insensitive), `display_name`,
  `avatar_url`; dibuat otomatis oleh trigger `handle_new_user`.

## Aturan Penting

1. AI key **tidak boleh** pernah sampai ke client. Tampilkan hanya status + 4 karakter akhir.
2. Semua mutasi lewat `app/actions.ts`; setiap action selain login wajib `requireAdmin()`.
3. Cron route wajib cek `Authorization: Bearer <CRON_SECRET>` dengan perbandingan timing-safe.
4. Jangan commit `.env.local`. Rahasia: `SUPABASE_SECRET_KEY` (fallback
   `SUPABASE_SERVICE_ROLE_KEY`), `APP_ENCRYPTION_KEY`, `ADMIN_SESSION_SECRET`, `CRON_SECRET`.
5. Perubahan skema disinkronkan ke `supabase/schema.sql` + `docs/DATABASE.md`.
6. Retensi quote = `QUOTE_RETENTION_DAYS` (7) & riwayat = `HISTORY_DAYS` (7) di `lib/constants.ts`.
7. Journal user: `userId` **selalu** dari sesi (`getCurrentUser()`), bukan body.
   `journal_date` dari `dateKey()` (WIB). Nickname unik (case-insensitive).
   Entri journal disimpan permanen (tidak ikut cron cleanup).

## Perintah

```bash
npm run dev            # dev (Turbopack)
npm run lint           # eslint
npx tsc --noEmit       # typecheck
npm run build          # build produksi
```

## Detail Rujukan

- Arsitektur & alur: `docs/ARCHITECTURE.md`
- Skema & RLS: `docs/DATABASE.md`
- Kontrak action & route: `docs/API.md`
- Setup & deploy: `docs/SETUP.md`
- Keamanan & enkripsi: `docs/SECURITY.md`

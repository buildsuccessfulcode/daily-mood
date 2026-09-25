# CONTEXT — Daily Mood

> File ini untuk agen AI. Baca ini dulu sebelum menelusuri repo. Jaga tetap ringkas.

## Tujuan

**Daily Mood**: web app harian untuk semua. Menampilkan 1 quote harian per kategori
(Gen Z / relatable), bisa diunduh jadi kartu PNG 3:4 dengan watermark yang bisa diatur
admin, untuk dibagikan ke WA Status / IG Story / TikTok. Konten diisi otomatis oleh
Gemini lewat cron.

PRD lengkap: `spesifikasi_pengembangan_daily_mood.md` (root). Beberapa detail
sudah disesuaikan (lihat "Perbedaan dari PRD" di bawah).

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
2. Retensi cleanup **14 hari** (PRD menulis 7), sesuai permintaan.
3. AI key **disimpan terenkripsi** di DB (AES-256-GCM), bukan hanya env. Env hanya
   menyimpan `APP_ENCRYPTION_KEY`.
4. Admin auth: password scrypt + cookie sesi bertanda tangan (HMAC), bukan password env.
5. Tidak ada demo mode; Supabase wajib.

## Peta File

```
app/
  layout.tsx                 root layout (font, metadata)
  globals.css                Tailwind v4 + token warna
  page.tsx                   landing (server): ambil quote harian -> <DailyMood>
  actions.ts                 server actions (satu-satunya jalur tulis): login/logout,
                             simpan hapus AI key, atur watermark, CRUD kategori,
                             generate/cleanup manual, ganti password, seed default
  admin/
    login/page.tsx           form login (client)
    (protected)/layout.tsx   guard requireAdmin
    (protected)/page.tsx     dashboard admin (server) + widget client
  api/cron/generate/route.ts route cron generate quote (Bearer CRON_SECRET)
  api/cron/cleanup/route.ts  route cron hapus quote > 14 hari
components/
  DailyMood.tsx              client: switcher kategori + kartu + tombol unduh
  QuoteCard.tsx              client: render kartu (di-screenshot)
  Logo.tsx                   komponen logo (public/logo.png)
  CategoryIcon.tsx           ikon lucide berdasarkan nama
  admin/AdminDashboard.tsx   client: form AI key, watermark, kategori, aksi manual
  admin/LoginForm.tsx        client: form login
hooks/useDownloadQuote.ts    unduh PNG via html-to-image
lib/
  config.ts                  pembaca env + isSupabaseConfigured
  constants.ts               kategori default, preset gradient, opsi ikon, retensi, model
  crypto.ts                  AES-256-GCM encrypt/decrypt (AI key)
  auth.ts                    scrypt hash/verify, token sesi HMAC, requireAdmin, rate limit
  gemini.ts                  generateQuote() via @google/genai
  quotes.ts                  logika murni: pickDailyQuote, groupByCategory
  types.ts                   tipe domain
  utils.ts                   cn()
  supabase/client.ts         browser anon (baca publik)
  supabase/server.ts         service role + anon server
supabase/
  schema.sql                 skema + RLS + index
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

## Aturan Penting

1. AI key **tidak boleh** pernah sampai ke client. Tampilkan hanya status + 4 karakter akhir.
2. Semua mutasi lewat `app/actions.ts`; setiap action selain login wajib `requireAdmin()`.
3. Cron route wajib cek `Authorization: Bearer <CRON_SECRET>` dengan perbandingan timing-safe.
4. Jangan commit `.env.local`. Rahasia: `SUPABASE_SECRET_KEY` (fallback
   `SUPABASE_SERVICE_ROLE_KEY`), `APP_ENCRYPTION_KEY`, `ADMIN_SESSION_SECRET`, `CRON_SECRET`.
5. Perubahan skema disinkronkan ke `supabase/schema.sql` + `docs/DATABASE.md`.
6. Retensi quote = `QUOTE_RETENTION_DAYS` (14) di `lib/constants.ts`.

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

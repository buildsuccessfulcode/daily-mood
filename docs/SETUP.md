# Setup & Deployment

## 1. Prasyarat

- Node.js 20.9+ (disarankan 22/24)
- npm
- Akun Supabase (free tier cukup)
- API key Google Gemini (dari Google AI Studio)

## 2. Supabase

1. Buat project di <https://supabase.com>.
2. Buka **SQL Editor**, jalankan [`supabase/schema.sql`](../supabase/schema.sql).
3. Jalankan [`supabase/seed.sql`](../supabase/seed.sql) (kategori default + admin awal).
4. Salin dari **Project Settings → API Keys**:
   - `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
   - `publishable key` -> `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `secret key` -> `SUPABASE_SECRET_KEY` (rahasia, server-only)
   - Nama JWT lama tetap didukung: `anon public key` ->
     `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `service_role key` ->
     `SUPABASE_SERVICE_ROLE_KEY`.

## 3. Environment

Buat `.env.local` dari [`.env.example`](../.env.example):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...

# 32 byte base64. Generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
APP_ENCRYPTION_KEY=

# rahasia cookie sesi admin (string acak panjang)
ADMIN_SESSION_SECRET=

# rahasia cron (Vercel akan mengirim sebagai Bearer)
CRON_SECRET=

# opsional: URL publik untuk metadata
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> AI key Gemini **tidak** ditaruh di env. Isi lewat `/admin` setelah login; disimpan
> terenkripsi di tabel `app_settings`.

## 4. Menjalankan Lokal

```bash
npm install
npm run dev
```

Buka <http://localhost:3000>. Login admin di <http://localhost:3000/admin/login>
(default `admin` / `admin123` — segera ganti).

## 5. Cron Lokal (opsional)

Panggil manual dengan secret:

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/generate
curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/cleanup
```

## 6. Deploy ke Vercel

1. Push repo ke GitHub, import di Vercel.
2. Tambahkan semua env di atas (Production + Preview).
3. Deploy. [`vercel.json`](../vercel.json) sudah mengatur cron:
   - `/api/cron/generate` -> `0 17 * * *` (00:00 WIB)
   - `/api/cron/cleanup` -> `0 18 * * *` (01:00 WIB)
4. Vercel otomatis mengirim header `Authorization: Bearer $CRON_SECRET` untuk cron.

## 7. Perintah

| Perintah | Fungsi |
| :--- | :--- |
| `npm run dev` | Server pengembangan (Turbopack) |
| `npm run build` | Build produksi |
| `npm run start` | Jalankan hasil build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Cek tipe |

## 8. Troubleshooting

| Gejala | Penyebab & solusi |
| :--- | :--- |
| Halaman kosong "Belum dikonfigurasi" | Env Supabase belum diisi / server belum restart. |
| Login gagal padahal password benar | `admins` belum di-seed atau `ADMIN_SESSION_SECRET` berubah. |
| Generate gagal "API key belum diatur" | Isi AI key di `/admin`. |
| Generate gagal 400 dari Gemini | Key salah/kuota habis; cek di Google AI Studio. |
| Cron 401 di Vercel | `CRON_SECRET` beda antara env Vercel dan saat uji lokal. |
| `permission denied for table ...` | `SUPABASE_SECRET_KEY` belum diisi. |

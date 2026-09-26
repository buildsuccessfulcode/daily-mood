# Daily Mood

Web app quote harian untuk semua: 1 quote per kategori, diunduh sebagai kartu PNG
3:4 dengan watermark yang bisa diatur admin. Konten diisi otomatis oleh Gemini dan
dibersihkan setelah 7 hari.

## Fitur

- 4 kategori Gen Z: Sadvibes & HTS, Lucu & Absurd, Manifest & Grind, Real Talk / POV.
- **Riwayat 7 hari**: pilih tanggal (hari ini s/d 6 hari lalu) + kategori, lalu lihat & unduh.
- Kartu estetik dengan gradien, ikon, dan **download PNG** (html-to-image) + watermark.
- **Dashboard admin** (`/admin`): simpan AI key Gemini (terenkripsi AES-256-GCM),
  atur watermark, manage kategori & prompt, generate/cleanup manual, ganti password.
- **Cron Vercel**: generate harian (00:00 WIB) & cleanup quote > 7 hari (01:00 WIB).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Supabase Postgres ·
Google Gemini `gemini-2.5-flash` · `html-to-image`.

## Mulai Cepat

```bash
npm install
cp .env.example .env.local   # isi kredensial
npm run dev
```

1. Jalankan `supabase/schema.sql` lalu `supabase/seed.sql` di Supabase SQL Editor.
2. Isi `.env.local` (lihat `.env.example`).
3. Login `/admin/login` (default `admin` / `admin123`), isi AI key, lalu **Generate**.

## Dokumentasi

| Dokumen | Isi |
| :--- | :--- |
| [`docs/CONTEXT.md`](docs/CONTEXT.md) | Ringkasan proyek untuk agen AI (baca dulu). |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Arsitektur & alur data. |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Skema tabel, RLS, cleanup. |
| [`docs/API.md`](docs/API.md) | Server actions, route cron, tipe. |
| [`docs/SETUP.md`](docs/SETUP.md) | Setup lokal, Supabase, deploy Vercel. |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Enkripsi, auth, header, validasi. |

## Perintah

```bash
npm run dev            # dev (Turbopack)
npm run build          # build produksi
npm run lint           # eslint
npx tsc --noEmit       # typecheck
```

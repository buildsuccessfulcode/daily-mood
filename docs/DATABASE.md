# Database

Skema lengkap: [`supabase/schema.sql`](../supabase/schema.sql). Jalankan di Supabase SQL Editor.
Seed: [`supabase/seed.sql`](../supabase/seed.sql).

## 1. Tabel

### `categories`

| Kolom | Tipe | Catatan |
| :--- | :--- | :--- |
| `id` | uuid PK | `gen_random_uuid()` |
| `key` | varchar(40) unik | `SADVIBES`, `RANDOM`, `MANIFEST`, `REALTALK` |
| `label` | varchar(80) | Nama tampil, mis. "Sadvibes & HTS" |
| `icon_name` | varchar(50) | Nama ikon lucide, mis. `cloud-rain` |
| `theme_gradient` | varchar(100) | Kelas Tailwind, mis. `from-slate-900 via-indigo-950 to-slate-900` |
| `prompt` | text | Instruksi Gemini per kategori |
| `sort_order` | int | Urutan tampil |
| `is_active` | boolean | Hanya yang aktif ikut generate & tampil |
| `created_at` / `updated_at` | timestamptz | |

### `quotes`

| Kolom | Tipe | Catatan |
| :--- | :--- | :--- |
| `id` | uuid PK | |
| `category_id` | uuid FK -> categories | `on delete cascade` |
| `text` | text | Isi quote |
| `theme_gradient` | varchar(100) | Snapshot dari kategori saat dibuat |
| `icon_name` | varchar(50) | Snapshot dari kategori saat dibuat |
| `created_at` | timestamptz | Index untuk cleanup & query harian |

### `admins`

| Kolom | Tipe | Catatan |
| :--- | :--- | :--- |
| `id` | uuid PK | |
| `username` | varchar(50) unik | |
| `password_hash` | text | Format `scrypt:N:r:p:saltB64:hashB64` |
| `last_login_at` | timestamptz | |
| `created_at` / `updated_at` | timestamptz | |

### `app_settings`

| Kolom | Tipe | Catatan |
| :--- | :--- | :--- |
| `key` | varchar(50) PK | `gemini_api_key`, `watermark` |
| `value` | text | Rahasia disimpan ciphertext `v1:...`; `watermark` plaintext |
| `created_at` / `updated_at` | timestamptz | |

## 2. Index

```sql
create index idx_quotes_category_created on public.quotes (category_id, created_at desc);
create index idx_quotes_created on public.quotes (created_at desc);
```

## 3. Row Level Security

| Tabel | RLS | Policy |
| :--- | :--- | :--- |
| `categories` | aktif | `select` untuk `anon` bila `is_active = true` |
| `quotes` | aktif | `select` untuk `anon` |
| `admins` | aktif | tanpa policy -> hanya service role |
| `app_settings` | aktif | tanpa policy -> hanya service role |

## 4. Cleanup (7 hari)

Dijalankan oleh cron `/api/cron/cleanup` (bukan `pg_cron`, agar mudah dipantau).
Ambang hapus = awal hari (zona `Asia/Jakarta`) dari `today - 6`, sehingga tepat
7 hari kalender (hari ini + 6 hari lalu) tetap tersimpan untuk riwayat.

```sql
DELETE FROM public.quotes
WHERE created_at < date_trunc('day', now() at time zone 'Asia/Jakarta')
  - interval '6 days';
```

Alternatif opsional via Supabase `pg_cron`:

```sql
select cron.schedule(
  'cleanup-old-quotes',
  '0 1 * * *',
  $$ delete from public.quotes
     where created_at < date_trunc('day', now() at time zone 'Asia/Jakarta')
       - interval '6 days' $$
);
```

## 5. Seed

`supabase/seed.sql` berisi:
- 4 kategori default (sesuai PRD).
- 1 admin default: username `admin`, password `admin123` (disimpan sebagai hash scrypt,
  bukan plaintext). **Ganti password setelah login pertama.**

AI key tidak di-seed (harus diisi lewat `/admin`, otomatis terenkripsi).

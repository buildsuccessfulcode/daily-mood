# API & Kontrak

## 1. Server Actions (`app/actions.ts`)

Semua action mengembalikan `ActionResult`:

```ts
type ActionResult =
  | { ok: true; message?: string; data?: unknown }
  | { ok: false; error: string };
```

| Action | Argumen | Auth | Efek |
| :--- | :--- | :--- | :--- |
| `loginAction` | `username, password` | publik (rate limited) | set cookie sesi, redirect `/admin` |
| `logoutAction` | - | admin | hapus cookie |
| `saveGeminiKeyAction` | `apiKey` | admin | enkripsi AES-256-GCM, upsert `app_settings` |
| `deleteGeminiKeyAction` | - | admin | hapus `gemini_api_key` |
| `saveWatermarkAction` | `watermark` | admin | validasi 1-60 char, upsert `app_settings` |
| `saveCategoryAction` | `id?, key, label, iconName, themeGradient, prompt, sortOrder, isActive` | admin | insert/update kategori |
| `deleteCategoryAction` | `id` | admin | hapus kategori (quote ikut terhapus) |
| `generateNowAction` | - | admin | generate 1 quote untuk tiap kategori aktif |
| `cleanupNowAction` | - | admin | hapus quote > 14 hari |
| `changePasswordAction` | `currentPassword, newPassword` | admin | verifikasi + ganti hash |
| `seedDefaultsAction` | - | admin | pastikan 4 kategori default ada |

Aturan:
- Semua action selain `loginAction` memanggil `requireAdmin()` di awal.
- Input divalidasi manual (panjang, format, whitelist ikon/gradient).
- Setelah mutasi panggil `revalidatePath('/')` dan/atau `revalidatePath('/admin')`.

## 2. Route Handler Cron

### `GET /api/cron/generate`

Header wajib: `Authorization: Bearer <CRON_SECRET>`.

```
1. Baca app_settings.gemini_api_key -> decrypt. Bila kosong -> 400.
2. Ambil categories where is_active.
3. Untuk tiap kategori: panggil Gemini (gemini-2.5-flash) dengan category.prompt.
4. Insert quote (text + snapshot gradient/icon).
Respon: { success, generated: [{ category, ok }] }
```

### `GET /api/cron/cleanup`

Header wajib: `Authorization: Bearer <CRON_SECRET>`.

```
DELETE quotes WHERE created_at < NOW() - INTERVAL '14 days'
Respon: { success, deleted_count }
```

Keduanya mengembalikan `401` bila header salah dan `500` bila terjadi error.

## 3. Tipe Domain (`lib/types.ts`)

```ts
type Category = {
  id: string;
  key: string;
  label: string;
  iconName: string;
  themeGradient: string;
  prompt: string;
  sortOrder: number;
  isActive: boolean;
};

type Quote = {
  id: string;
  categoryId: string;
  text: string;
  themeGradient: string;
  iconName: string;
  createdAt: string;
};

type QuoteCard = { category: Category; quote: Quote };

type Admin = { id: string; username: string; lastLoginAt: string | null };
```

## 4. Konstanta (`lib/constants.ts`)

- `QUOTE_RETENTION_DAYS = 14`
- `GEMINI_MODEL = 'gemini-2.5-flash'`
- `DEFAULT_CATEGORIES` (4 sesuai PRD)
- `GRADIENT_PRESETS`, `ICON_OPTIONS` (untuk form admin)
- `ADMIN_COOKIE = 'dm_admin'`, `ADMIN_SESSION_MAX_AGE = 60 * 60 * 12`

## 5. Fungsi Murni (`lib/quotes.ts`)

- `groupByCategory(quotes)` -> `Map<categoryId, Quote[]>`
- `pickDailyQuote(quotes, date)` -> pilih 1 quote deterministik: index `hariKe-N % jumlah`.
- `isQuoteNew(date, quote, now)` -> cek masih dalam retensi (untuk tampilan).

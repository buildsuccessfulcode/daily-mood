# Keamanan

## 1. Prinsip

1. **Rahasia tidak pernah ke client.** `SUPABASE_SECRET_KEY` (atau `SUPABASE_SERVICE_ROLE_KEY`),
   `APP_ENCRYPTION_KEY`, `ADMIN_SESSION_SECRET`, `CRON_SECRET`, dan AI key tidak pernah
   dikirim ke browser.
2. **Least privilege di DB.** Anon hanya `SELECT` tabel publik (`categories`, `quotes`).
   `admins` & `app_settings` tanpa policy RLS -> tidak bisa dibaca anon.
3. **Defense in depth.** Setiap mutasi dicek ulang di server (tidak percaya client).

## 2. Penyimpanan AI Key

- Diisi admin lewat `/admin`, disimpan di `app_settings` sebagai ciphertext.
- Algoritma: **AES-256-GCM** dengan IV acak 12 byte + auth tag 16 byte per enkripsi.
- Format: `v1:<base64(iv || tag || ciphertext)>`.
- Kunci enkripsi: `APP_ENCRYPTION_KEY` (32 byte base64) dari env, hanya di server.
- Client hanya menerima status "terisi" + 4 karakter terakhir (masked).

## 3. Password & Sesi Admin

- Password di-hash **scrypt** (N=16384, r=8, p=1, 64 byte, salt 16 byte acak).
  Format simpan: `scrypt:N:r:p:saltB64:hashB64`. Verifikasi pakai `timingSafeEqual`.
- Sesi = token stateless: `base64url(adminId.expiry) . HMAC-SHA256(payload, secret)`.
- Cookie `dm_admin`: `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` di produksi,
  `maxAge` 12 jam.
- Login dibatasi rate-limit in-memory per IP (best effort di serverless).

## 4. Cron

- Setiap route `/api/cron/*` memeriksa `Authorization: Bearer <CRON_SECRET>`.
- Perbandingan memakai `timingSafeEqual` dan panjang header yang dicek lebih dulu.

## 5. Header HTTP (`next.config.ts`)

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Content-Security-Policy`: `default-src 'self'`; `img-src 'self' data: blob:
  https://*.googleusercontent.com`; `connect-src 'self' https://*.supabase.co ws: wss:`;
  `font-src 'self' data:`; `style-src 'self' 'unsafe-inline'`; `script-src 'self'
  'unsafe-inline' 'unsafe-eval'`. (`unsafe-inline/eval` diperlukan untuk runtime Next
  dev; bisa diperketat dengan nonce.)

## 6. Validasi Input

- Semua action memvalidasi tipe/panjang. `icon_name` & `theme_gradient` dicek terhadap
  whitelist (`ICON_OPTIONS`, `GRADIENT_PRESETS`), kecuali prompt yang bebas (dibatasi panjang).
- `key` kategori dibatasi regex `^[A-Z0-9_]{2,40}$`.
- Body/`FormData` dibaca dengan `formData.get()` + konversi eksplisit.

## 7. Yang TIDAK dilakukan

- Tidak menyimpan gambar di server (0 media storage) -> mengurangi risiko upload berbahaya.
- Tidak ada endpoint publik yang menerima API key atau operasi tulis tanpa auth.

## 8. Autentikasi Pengguna (Journal)

- Memakai **Supabase Auth** dengan cookie sesi yang dikelola `@supabase/ssr`
  (`HttpOnly`, `Secure`, `SameSite=Lax`). `proxy.ts` me-refresh token di setiap
  request, tetapi otorisasi tetap dicek di server action/data layer.
- Login **hanya Google**. Registrasi manual dihapus, sehingga permukaan serangan
  password (penyimpanan/kebocoran) tidak ada.
- `userId` **selalu** diambil dari sesi (`getCurrentUser()`), tidak pernah dari
  body request. Ini menutup celah pada draf PRD awal (`userId` dari client).
- Nickname unik dijamin di level DB (index `lower(nickname)`); saat bentrok,
  `generateUniqueNickname` menambah suffix. `updateProfileAction` memvalidasi
  pola + keunikan sebelum menyimpan.

## 9. Privasi Journal

- RLS `user_journals`: `select`/`insert` hanya bila `auth.uid() = user_id`.
- RLS `profiles`: `select`/`insert`/`update` hanya bila `auth.uid() = id`.
- Nickname unik secara case-insensitive via index `lower(nickname)`.
- AI key Gemini hanya dibaca lewat service role di server; tidak pernah ke client.
- Entri journal tidak pernah di-join atau ditampilkan ke user lain.

## 10. Foto Profil

- Avatar Google di-hotlink (`lh3.googleusercontent.com`) -> 0 storage, tidak ada
  upload. Fallback inisial dirender lokal. Tidak ada file yang disimpan server.

-- Daily Mood - seed default
-- Jalankan setelah schema.sql. Aman dijalankan berulang (tidak menimpa data).

-- 1. Kategori default (sesuai PRD)
insert into public.categories (key, label, icon_name, theme_gradient, prompt, sort_order, is_active)
values
    (
        'SADVIBES',
        'Sadvibes & HTS',
        'cloud-rain',
        'from-slate-900 via-indigo-950 to-slate-900',
        'Kamu adalah konten kreator anak muda. Buat 1 quote galau modern (25-35 kata) tentang HTS, ghosting, atau overthinking anak muda. Bahasa gaul, emosional, mendalam, tanpa alay berlebihan. Balas hanya isi quote tanpa tanda kutip dan tanpa penjelasan.',
        1,
        true
    ),
    (
        'RANDOM',
        'Lucu & Absurd',
        'laugh',
        'from-amber-500 via-orange-600 to-red-600',
        'Kamu adalah komedian sarkas. Buat 1 quote lucu dan sarkas (25-35 kata) tentang penderitaan tugas, pekerjaan, atau kelakuan absurd harian anak muda. Balas hanya isi quote tanpa tanda kutip dan tanpa penjelasan.',
        2,
        true
    ),
    (
        'MANIFEST',
        'Manifest & Grind',
        'zap',
        'from-emerald-600 via-teal-700 to-cyan-900',
        'Kamu adalah mentor muda. Buat 1 quote motivasi tajam (25-35 kata) tentang fokus nambah skill, mandiri secara finansial, dan pembuktian diri (lock in/glow up) untuk anak muda. Balas hanya isi quote tanpa tanda kutip dan tanpa penjelasan.',
        3,
        true
    ),
    (
        'REALTALK',
        'Real Talk / POV',
        'lightbulb',
        'from-blue-700 via-slate-800 to-indigo-950',
        'Kamu adalah pengamat sosial remaja. Buat 1 quote Real Talk atau POV (25-35 kata) tentang kenyataan pertemanan, kedewasaan, atau pelajaran hidup remaja yang jujur. Balas hanya isi quote tanpa tanda kutip dan tanpa penjelasan.',
        4,
        true
    )
on conflict (key) do nothing;

-- 2. Admin awal
-- username: admin | password: admin123  (SEGERA GANTI setelah login pertama)
-- password_hash memakai format scrypt:N:r:p:saltB64:hashB64 (bukan plaintext).
insert into public.admins (username, password_hash)
values (
    'admin',
    'scrypt:16384:8:1:eA8oF7bCszUXZU78HWExHA==:mGepchg0CoUFEa4/j8u3W2fKnqaTodM8e3Bj4nk/35EoHzrgxM1PmpaRcCM8CfKromhGktrA6/i2M7OLBsttew=='
)
on conflict (username) do nothing;

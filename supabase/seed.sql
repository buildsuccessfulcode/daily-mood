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
        $dm$Peran: penulis konten galau viral untuk IG Story/TikTok/X Gen Z Indonesia.
Tema: galau, HTS, ghosting, overthinking, atau harapan yang tidak dibalas.
Formula: 1 baris hook yang bikin berhenti scroll, 1-2 baris isi yang makin dalam, 1 baris twist pahit-manis di akhir.
Pola hook: 'POV:', 'Tanda kamu...', 'Yang paling nyakitin itu...', 'Lucunya, ...'.
Larangan: klise dan kata usang (move on, toxic, red flag, baper); jangan menjelaskan atau menasihati panjang.
Batas: maksimal 22 kata, ideal 12-18 kata, 2-3 baris pendek.
Format: balas hanya isi quote, tanpa tanda kutip, tanpa hashtag, tanpa emoji, tanpa penjelasan.$dm$,
        1,
        true
    ),
    (
        'RANDOM',
        'Lucu & Absurd',
        'laugh',
        'from-amber-500 via-orange-600 to-red-600',
        $dm$Peran: komedian sarkas penulis konten lucu viral untuk IG/TikTok/X Gen Z Indonesia.
Tema: tugas, kerjaan, dompet tipis, atau kelakuan absurd harian.
Formula: 1 baris setup singkat yang relatable, lalu 1-2 baris punchline tak terduga yang bikin ketawa.
Pola hook: 'Ternyata...', 'Gak ada yang bilang...', 'Kalau dipikir-pikir...'.
Larangan: lelucon dan punchline usang; jangan menjelaskan leluconnya.
Batas: maksimal 22 kata, ideal 12-18 kata, 2-3 baris pendek. Boleh hiperbola.
Format: balas hanya isi quote, tanpa tanda kutip, tanpa hashtag, tanpa emoji, tanpa penjelasan.$dm$,
        2,
        true
    ),
    (
        'MANIFEST',
        'Manifest & Grind',
        'zap',
        'from-emerald-600 via-teal-700 to-cyan-900',
        $dm$Peran: mentor muda penulis konten motivasi viral untuk IG/TikTok/X Gen Z Indonesia.
Tema: fokus naik level, mandiri finansial, dan pembuktian diri (lock in/glow up).
Formula: 1 baris afirmasi atau perintah tegas, 1-2 baris alasan yang menggugah, 1 baris dorongan 'gas' di akhir.
Pola hook: 'Lock in.', 'Satu hari...', 'Berhenti nunggu...', 'Tahun ini...'.
Larangan: motivasi klise dan kata usang (toxic positivity, hustle culture); jangan bertele-tele.
Batas: maksimal 22 kata, ideal 12-18 kata, 2-3 baris pendek.
Format: balas hanya isi quote, tanpa tanda kutip, tanpa hashtag, tanpa emoji, tanpa penjelasan.$dm$,
        3,
        true
    ),
    (
        'REALTALK',
        'Real Talk / POV',
        'lightbulb',
        'from-blue-700 via-slate-800 to-indigo-950',
        $dm$Peran: pengamat sosial penulis konten Real Talk atau POV viral untuk IG/TikTok/X Gen Z Indonesia.
Tema: pertemanan, kedewasaan, atau pelajaran hidup yang jujur dan ngena.
Formula: 1 baris pengamatan tajam, 1-2 baris pengembangan yang relate, 1 baris insight yang bikin diam sejenak.
Pola hook: 'Semakin dewasa...', 'Pelan-pelan kamu sadar...', 'Yang jarang dibahas...'.
Larangan: klise dan nasihat usang; jangan menggurui atau bertele-tele.
Batas: maksimal 22 kata, ideal 12-18 kata, 2-3 baris pendek.
Format: balas hanya isi quote, tanpa tanda kutip, tanpa hashtag, tanpa emoji, tanpa penjelasan.$dm$,
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

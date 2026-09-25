# 📘 Spesifikasi Pengembangan & PRD: Daily Mood

Dokumen ini berisi gambaran teknis lengkap untuk pembangunan aplikasi **Daily Mood**. Dokumen ini dirancang sebagai panduan teknis utama bagi pengembang maupun instruksi konteks untuk AI coding assistant.

---

## 1. Executive Summary & PRD

### 1.1 Product Vision
**Daily Mood** adalah web app harian untuk Pengguna yang menyajikan 1 kata-kata/quote harian khas Gen Z berdasarkan 4 kategori utama. Aplikasi ini mempermudah siswa mengekspresikan mood harian mereka ke media sosial (WhatsApp Status, Instagram Story, TikTok) melalui kartu visual (*quote card*) yang estetis, dinamis, dan dilengkapi watermark perlindungan brand.

### 1.2 Target Audience
* **Segmen Utama:** Pengguna di Indonesia (Usia 15–18 tahun).
* **Karakteristik:** Menyukai konten *relatable* seputar PKL, tugas praktek, hubungan HTS/galau, motivasi *glow up*, serta sindiran halus (*real talk*).

### 1.3 Key Features (MVP)
1. **Daily Quote Viewer:** Menampilkan kata-kata harian unik sesuai kategori.
2. **Category Switcher:** Pilihan 4 kategori (*Sadvibes & HTS*, *Lucu & Absurd*, *Manifest & Grind*, *Real Talk / POV*).
3. **Dynamic Aesthetic Card Engine:** Kartu visual berbasis gradien dinamis dan ikon (Lucide Icons / Emoji Native) dengan ukuran teks *responsive*.
4. **Client-side Image Exporter & Watermark:** Fitur *Download PNG* instan yang merender kartu lengkap dengan logo dan handle watermark aplikasi (`@dailymood`).
5. **Automated Content Pipeline:** Cron Job harian yang memanggil Gemini API untuk mengisi database dan menghapus data lama secara otomatis.

---

## 2. Arsitektur Sistem & Tech Stack

```text
[ Vercel Cron Job (00:00 WIB) ]
             │
             ▼
[ Next.js API Route / App Router ]
             │
      (Gemini 2.5 API)
             │
             ▼
[ Supabase PostgreSQL DB ] ◄─── (Delete > 7 hari via Auto Cleanup)
             │
       (Fetch Data)
             │
             ▼
[ Next.js Frontend (Tailwind + html-to-image) ]
             │
      (Render Client-side PNG + Watermark)
             │
             ▼
[ User Device / Download & Share ]
```

### 2.1 Tech Stack
* **Frontend Framework:** Next.js (App Router, React 19, TypeScript).
* **Styling & UI:** Tailwind CSS, Lucide React (Icons), `clsx`, `tailwind-merge`.
* **Export Library:** `html-to-image` (Client-side HTML-to-PNG conversion).
* **Database & BaaS:** Supabase (PostgreSQL).
* **AI Model:** Google Gemini 2.5 Flash API (`@google/genai` SDK).
* **Deployment & Cron:** Vercel (Edge Functions + Vercel Cron).

---

## 3. Desain Database (Supabase PostgreSQL)

Database didesain sangat efisien. Hanya menyimpan teks dan metadata ringan tanpa menyimpan file gambar (0 MB media storage).

### 3.1 Table Schema: `quotes`

```sql
-- Create Enum for Categories
CREATE TYPE quote_category AS ENUM ('SADVIBES', 'RANDOM', 'MANIFEST', 'REALTALK');

-- Create Quotes Table
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category quote_category NOT NULL,
    text TEXT NOT NULL,
    theme_gradient VARCHAR(100) NOT NULL DEFAULT 'from-indigo-600 to-purple-600',
    icon_name VARCHAR(50) NOT NULL DEFAULT 'cloud-rain',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for Fast Querying Daily Quote
CREATE INDEX idx_quotes_category_created ON quotes(category, created_at DESC);
```

### 3.2 SQL Cron Job Cleanup (Opsional via Supabase `pg_cron`)

```sql
-- Jalankan cleanup otomatis setiap hari jam 01:00 UTC
SELECT cron.schedule(
  'cleanup-old-quotes',
  '0 1 * * *',
  $$ DELETE FROM quotes WHERE created_at < NOW() - INTERVAL '7 days' $$
);
```

---

## 4. Prompt Engineering untuk Gemini API

Integrasi panggilan AI di Route Handler Next.js (`/api/cron/generate`).

### 4.1 System Prompt Configuration

```typescript
export const GEMINI_CATEGORY_CONFIG = {
  SADVIBES: {
    icon: 'cloud-rain',
    gradient: 'from-slate-900 via-indigo-950 to-slate-900',
    prompt: `Kamu adalah konten kreator anak muda. Buat 1 quote galau modern (25-35 kata) tentang HTS, ghosting, atau overthinking anak muda. Bahasa gaul, emosional, mendalam, tanpa alay berlebihan.`
  },
  RANDOM: {
    icon: 'laugh',
    gradient: 'from-amber-500 via-orange-600 to-red-600',
    prompt: `Kamu adalah komedian sarkas. Buat 1 quote lucu dan sarkas (25-35 kata) tentang penderitaan tugas sekolah, praktek PKL, atau kelakuan absurd harian anak muda.`
  },
  MANIFEST: {
    icon: 'zap',
    gradient: 'from-emerald-600 via-teal-700 to-cyan-900',
    prompt: `Kamu adalah mentor muda. Buat 1 quote motivasi tajam (25-35 kata) tentang fokus nambah skill, mandiri secara finansial, dan pembuktian diri (lock in/glow up) untuk anak muda.`
  },
  REALTALK: {
    icon: 'lightbulb',
    gradient: 'from-blue-700 via-slate-800 to-indigo-950',
    prompt: `Kamu adalah pengamat sosial remaja. Buat 1 quote Real Talk atau POV (25-35 kata) tentang kenyataan pertemanan, kedewasaan, atau pelajaran hidup remaja yang jujur.`
  }
};
```

---

## 5. UI/UX Specification & Layout

### 5.1 Design System
* **Typography:** `Plus Jakarta Sans` or `Inter` (Sans-serif modern, clean, highly readable).
* **Color Palette:** Dark Mode Aesthetic (Slate-900 background) dengan aksen Neon/Glow pada kartu.
* **Aspect Ratio Kartu:** `3:4` atau `9:16` (Dioptimalkan untuk Instagram Story / WA Status).

### 5.2 Layout Komponen Kartu (`QuoteCard.tsx`)

```tsx
/* Structure Draft UI Component */
<div ref={cardRef} className="w-[360px] h-[480px] rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br ...">
  {/* Subtle Background Watermark */}
  <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none rotate-[-20deg] text-4xl font-extrabold select-none">
    @dailymood
  </div>

  {/* Header: Category Badge & Icon */}
  <div className="flex items-center justify-between z-10">
    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-xs font-semibold text-white">
      <CategoryIcon name={iconName} className="w-4 h-4" />
      <span>{categoryLabel}</span>
    </div>
    <span className="text-xs text-white/60 font-medium">{dateToday}</span>
  </div>

  {/* Center: Main Quote Text */}
  <div className="my-auto z-10">
    <p className="text-lg md:text-xl font-medium text-white leading-relaxed tracking-wide">
      "{quoteText}"
    </p>
  </div>

  {/* Footer: Watermark Branding */}
  <div className="pt-4 border-t border-white/15 flex items-center justify-between text-xs z-10 text-white/80">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-white text-slate-900 flex items-center justify-center font-bold text-[10px]">
        S
      </div>
      <span className="font-bold tracking-wider">Daily Mood</span>
    </div>
    <span className="text-white/50 font-mono">@dailymood</span>
  </div>
</div>
```

---

## 6. Implementation Code Guidelines

### 6.1 Route Handler Generate Quote (`/app/api/cron/generate/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { GEMINI_CATEGORY_CONFIG } from '@/lib/constants';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const entries = Object.entries(GEMINI_CATEGORY_CONFIG);

    for (const [categoryKey, config] of entries) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: config.prompt,
      });

      const text = response.text?.trim();

      if (text) {
        await supabase.from('quotes').insert({
          category: categoryKey,
          text: text,
          theme_gradient: config.gradient,
          icon_name: config.icon,
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Quotes generated successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
```

### 6.2 Route Handler Cleanup (`/app/api/cron/cleanup/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - 7);

  try {
    const { count, error } = await supabase
      .from('quotes')
      .delete({ count: 'exact' })
      .lt('created_at', thresholdDate.toISOString());

    if (error) throw error;

    return NextResponse.json({ success: true, deleted_count: count });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
```

---

## 7. Configuration Files

### 7.1 `vercel.json` (Vercel Cron Schedule)

```json
{
  "crons": [
    {
      "path": "/api/cron/generate",
      "schedule": "0 17 * * *"
    },
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 18 * * *"
    }
  ]
}
```

### 7.2 `.env.local` Template

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
CRON_SECRET=your-custom-cron-secret
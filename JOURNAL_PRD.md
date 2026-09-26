Dokumen **Product Requirement Document (PRD)** untuk fitur **AI Interactive Daily Journal & Voice Companion** telah disusun secara rapi dan komprehensif.

Silakan *copy-paste* seluruh isi dokumen Markdown di bawah ini ke dalam file proyek kamu (misalnya buat file `JOURNAL_PRD.md` di folder proyek):

```markdown
# 📖 Product Requirement Document (PRD): AI Daily Journal & Voice Companion

**Application Name:** Daily Mood  
**Feature Name:** AI Interactive Daily Journal (1 Entry / Day) with Voiceover  
**Target Audience:** Remaja, Pelajar (SMK/SMA), Gen Z / Umum  
**Document Status:** Technical & UX Specification for Development  

---

## 1. Executive Summary & Value Proposition

Fitur **AI Daily Journal** bertindak sebagai ruang aman (*safe space*) pribadi bagi pengguna untuk mencurahkan seluruh rangkuman kejadian dan perasaan mereka dalam satu hari (*reflective evening journaling*). 

Berbeda dari aplikasi *chatting* reaktif yang memicu kecanduan, fitur ini membatasi pengguna hanya **1 entri diary per hari**. AI Gemini berfungsi sebagai teman reflektif yang memberikan respons hangat, empatis, dan validasi emosional tanpa menceramahi. Balasan AI juga dapat didengarkan langsung menggunakan fitur **Voiceover (Text-to-Speech)** layaknya mendengarkan pesan suara (*voice note*) dari teman dekat.

### Key Objectives:
1. **User Retention:** Meningkatkan *Daily Active Users* (DAU) melalui rutinitas refleksi harian.
2. **Cost & Resource Efficiency:** Menjaga pemanggilan Gemini API maksimal 1x per user/hari.
3. **Immersive Audio UX:** Menyediakan balasan suara (*Voice Note Effect*) menggunakan *Web Speech API* yang 100% gratis dan ringan.
4. **Privacy-First Architecture:** Menjamin kerahasiaan curhatan pengguna dengan *Row Level Security* (RLS).

---

## 2. User Experience & User Flow

```text
[ Open App & Login ] ──► [ Check Daily Journal Status ]
                                   │
          ┌────────────────────────┴────────────────────────┐
          ▼                                                 ▼
[ Not Created Today ]                             [ Already Created Today ]
          │                                                 │
  1. Select Primary Mood                             1. Read Today's Entry
  2. Write Daily Summary                             2. Read AI Companion Response
  3. Submit to AI                                    3. Listen to AI Voice Note 🔊
          │                                          4. View Mood Calendar & History
          ▼                                                 │
[ AI Generates Response ]                                   ▼
          │                                   [ Locked: "Write Again Tomorrow" ]
          ▼
[ Audio Player Ready ]

```

### User Journey Steps:

1. **Check Status:** Saat memasuki tab *Journal*, sistem mengecek apakah terdapat rekaman `journal_date = CURRENT_DATE` untuk `user_id` tersebut.
2. **Writing State (Jika belum ada entri hari ini):**
* Pengguna memilih 1 dari 5 indikator *Primary Mood*.
* Pengguna menuliskan rangkuman hariannya di *Text Area* (20 - 500 kata).
* Menekan tombol **"Kirim & Dengarkan"**.


3. **Loading State:** Animasi halus saat AI memproses respons (durasi ~2–4 detik).
4. **Completed / Locked State (Jika sudah ada entri hari ini):**
* Menampilkan tulisan pengguna beserta balasan teks dari AI Gemini.
* Menampilkan tombol pemutar suara **"Putar Suara / Voice Note"**.
* Menampilkan status terkunci dengan pesan: *"Refleksi hari ini selesai. Kamu bisa menulis kembali besok pukul 00:00 WIB."*
* Menampilkan kalender riwayat mood bulanan (*Mood History Calendar*).



---

## 3. Functional Requirements

### 3.1 Authentication & Profile

* Pengguna **wajib login** (Supabase Auth: Email/Password atau Google OAuth) untuk mengakses tab Journal.
* Pengguna anonim/tamu (*guest*) yang menekan tab Journal akan diarahkan ke halaman Login/Register.

### 3.2 Journal Form & Validation Rules

* **Primary Mood Selection:** Required. Pilihan:
* 😭 `SAD` (Berat Banget)
* 🫠 `TIRED` (Pasrah / Capek)
* 😐 `NEUTRAL` (B-Aja / Datar)
* 😃 `HAPPY` (Cukup Happy)
* ⚡ `EXCITED` (On Fire / Semangat)


* **Text Input Validation:**
* Minimum: **20 kata** (Mencegah input kosong/tidak bermakna).
* Maksimum: **500 kata** (Mencegah over-token pada Gemini API).


* **Submission Constraint:** Terkunci secara otomatis jika pengguna sudah mengirimkan entri pada tanggal berjalan.

### 3.3 AI Response & Persona System Prompt

* **Model:** `gemini-2.5-flash` via `@google/genai`.
* **Persona System Prompt:**
> *"Kamu adalah 'Daily Companion', seorang teman terpercaya yang ramah, empatis, hangat, dan tidak pernah menggurui untuk anak muda/remaja Indonesia.*
> *Tugasmu:*
> 1. *Baca rangkuman curhatan harian pengguna.*
> 2. *Berikan balasan empati yang tulus (100–150 kata).*
> 3. *Struktur Balasan: (a) Validasi emosi pengguna, (b) Soroti hal positif/pembelajaran kecil dari ceritanya, (c) Penutup hangat & penyemangat istirahat.*
> 4. *Gaya Bahasa: Bahasa Indonesia gaul santai, ramah, dan hangat ('aku', 'kamu', 'pasti capek banget ya', 'wajar kok'). DILARANG menggunakan bahasa baku seperti surat resmi atau gaya guru BK.*
> 5. *Safety Rule: Jika cerita terdeteksi indikasi self-harm/keinginan mengakhiri hidup, berikan pesan empati hangat disertai kontak layanan bantuan/helpline krisis kesehatan mental di Indonesia secara sopan."*
> 
> 



### 3.4 Audio Voiceover Engine (Web Speech API)

* Menggunakan *Native Browser Speech Synthesis* (`window.speechSynthesis`).
* **Language:** `id-ID` (Bahasa Indonesia).
* **Speech Rate:** `0.9` (Sedikit lebih pelan dari normal agar terasa tenang/soothing).
* **UI Player:** Tombol *Play/Stop* dinamis dengan indikator ikon audio.

---

## 4. Technical Architecture & Database Design

### 4.1 Database Schema (Supabase Postgres)

```sql
-- 1. Enum untuk Jenis Mood Harian
CREATE TYPE user_mood_type AS ENUM ('SAD', 'TIRED', 'NEUTRAL', 'HAPPY', 'EXCITED');

-- 2. Tabel User Journals
CREATE TABLE user_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  journal_date DATE DEFAULT CURRENT_DATE NOT NULL,
  mood user_mood_type NOT NULL,
  entry_text TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- CONSTRAINT KUNCI: Memastikan 1 User HANYA BISA membuat 1 entry per hari
  CONSTRAINT unique_user_daily_journal UNIQUE (user_id, journal_date)
);

-- 3. Index untuk Kecepatan Fetch History
CREATE INDEX idx_user_journals_lookup ON user_journals(user_id, journal_date DESC);

-- 4. Row Level Security (RLS) - Kebijakan Privasi
ALTER TABLE user_journals ENABLE ROW LEVEL SECURITY;

-- Pengguna HANYA bisa membaca diary miliknya sendiri
CREATE POLICY "Users can view own journals"
  ON user_journals FOR SELECT
  USING (auth.uid() = user_id);

-- Pengguna HANYA bisa membuat diary untuk dirinya sendiri
CREATE POLICY "Users can insert own journal"
  ON user_journals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

```

### 4.2 API Endpoint Route (`app/api/journal/submit/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { decrypt } from '@/lib/crypto';

export async function POST(request: Request) {
  try {
    const { userId, mood, entryText } = await request.json();

    // 1. Validasi Input Kata
    const wordCount = entryText.trim().split(/\s+/).length;
    if (wordCount < 20 || wordCount > 500) {
      return NextResponse.json({ error: 'Tulisan minimal 20 kata dan maksimal 500 kata.' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. Cek apakah user sudah pernah submit hari ini
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('user_journals')
      .select('id')
      .eq('user_id', userId)
      .eq('journal_date', today)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Kamu sudah menulis diary hari ini!' }, { status: 429 });
    }

    // 3. Dekripsi Gemini API Key dari Database System Config
    const { data: config } = await supabase
      .from('system_config')
      .select('value_encrypted')
      .eq('key', 'GEMINI_API_KEY')
      .single();

    if (!config) throw new Error('API Key configuration error');
    const apiKey = decrypt(config.value_encrypted);

    // 4. Panggil Gemini API
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `[User Mood: ${mood}]\n[Rangkuman Hari Ini]: "${entryText}"`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: `Kamu adalah 'Daily Companion', teman terpercaya yang ramah, empatis, dan hangat untuk anak muda Indonesia. Berikan balasan empati yang tulus (100-150 kata) dalam bahasa gaul santai khas anak muda.`
      }
    });

    const aiResponseText = response.text || 'Terima kasih sudah berbagi cerita hari ini. Istirahat yang cukup ya!';

    // 5. Simpan ke Database
    const { data: newJournal, error: insertError } = await supabase
      .from('user_journals')
      .insert({
        user_id: userId,
        journal_date: today,
        mood: mood,
        entry_text: entryText,
        ai_response: aiResponseText
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, journal: newJournal });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

```

### 4.3 Component Implementation (`components/AIResponseCard.tsx`)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Play, Square, Volume2 } from 'lucide-react';

export default function AIResponseCard({ aiResponse }: { aiResponse: string }) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Browser kamu belum mendukung fitur pemutar suara.');
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(aiResponse);
      utterance.lang = 'id-ID';
      utterance.rate = 0.9; // Kecepatan agak lambat agar rileks

      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      setIsPlaying(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900/80 backdrop-blur-md border border-slate-800 text-white space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
          <Volume2 className="w-4 h-4"/> Balasan Teman AI
        </span>

        <button
          onClick={toggleSpeech}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium transition-all border border-emerald-500/30"
        >
          {isPlaying ? (
            <>
              <Square className="w-3.5 h-3.5 fill-emerald-300"/> Stop Suara
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-emerald-300"/> Putar Suara
            </>
          )}
        </button>
      </div>

      <p className="text-sm leading-relaxed text-slate-200 font-sans">
        {aiResponse}
      </p>
    </div>
  );
}

```

---

## 5. Security, Privacy & Compliance

1. **Row Level Security (RLS):** Mencegah kebocoran data curhatan antar pengguna di tingkat Postgres DB.
2. **Encrypted at Rest:** Tulisan diary dan respons AI tersimpan di Supabase dengan proteksi akses terisolasi per akun.
3. **Safety Disclaimer UI:** Di bagian bawah form tulisan, cantumkan teks transparan:
> *"Daily Companion adalah AI kawan refleksi harian dan bukan pengganti konseling psikologis profesional."*



---

## 6. Success Metrics (KPIs)

* **Daily Journal Completion Rate:** % pengguna terdaftar yang menyelesaikan 1 entri diary harian.
* **Voice Note Engagement:** % pengguna yang menekan tombol *Putar Suara* untuk mendengarkan respons AI.
* **7-Day Retention:** % pengguna yang kembali menulis diary setidaknya 4 dari 7 hari dalam seminggu.
* **Cost Stability:** Kuota API Gemini stabil berkat pembatasan ketat 1 entri/hari per pengguna.

```

```
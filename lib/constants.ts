import type { MoodOption, MoodType } from "./types";

export const BRAND_NAME = "Daily Mood";
export const DEFAULT_WATERMARK = "@dailymood";
export const WATERMARK_SETTING_KEY = "watermark";

export const ADMIN_COOKIE = "dm_admin";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;

export const QUOTE_RETENTION_DAYS = 7;
export const HISTORY_DAYS = 7;
export const GEMINI_MODEL = "gemini-2.5-flash";
export const GEMINI_MODEL_SETTING_KEY = "gemini_model";

export const JOURNAL_MIN_WORDS = 20;
export const JOURNAL_MAX_WORDS = 500;
export const JOURNAL_HISTORY_DAYS = 30;

export const MOOD_OPTIONS: MoodOption[] = [
  { value: "SAD", emoji: "\u{1F62D}", label: "Berat Banget", hint: "sedih, capek hati" },
  { value: "TIRED", emoji: "\u{1FAE0}", label: "Pasrah / Capek", hint: "lelah, mau istirahat" },
  { value: "NEUTRAL", emoji: "\u{1F610}", label: "B-Aja / Datar", hint: "biasa aja" },
  { value: "HAPPY", emoji: "\u{1F603}", label: "Cukup Happy", hint: "senang" },
  { value: "EXCITED", emoji: "\u{26A1}", label: "On Fire", hint: "semangat" },
];

export function moodOption(value: MoodType): MoodOption | undefined {
  return MOOD_OPTIONS.find((option) => option.value === value);
}

export const GEMINI_MODELS: { label: string; value: string }[] = [
  { label: "Gemini 2.5 Flash (seimbang)", value: "gemini-2.5-flash" },
  { label: "Gemini 2.5 Flash Lite (paling hemat)", value: "gemini-2.5-flash-lite" },
  { label: "Gemini 2.5 Pro (paling pintar)", value: "gemini-2.5-pro" },
  { label: "Gemini 2.0 Flash", value: "gemini-2.0-flash" },
  { label: "Gemini 2.0 Flash Lite", value: "gemini-2.0-flash-lite" },
];

export const GEMINI_MODEL_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/;

export function isValidGeminiModel(value: string): boolean {
  return (
    GEMINI_MODEL_PATTERN.test(value) ||
    GEMINI_MODELS.some((model) => model.value === value)
  );
}

export function geminiModelLabel(value: string): string {
  return GEMINI_MODELS.find((model) => model.value === value)?.label ?? value;
}

export type CategorySeed = {
  key: string;
  label: string;
  iconName: string;
  themeGradient: string;
  prompt: string;
  sortOrder: number;
};

export const DEFAULT_CATEGORIES: CategorySeed[] = [
  {
    key: "SADVIBES",
    label: "Sadvibes & HTS",
    iconName: "cloud-rain",
    themeGradient: "from-slate-900 via-indigo-950 to-slate-900",
    prompt:
      "Peran: penulis konten galau viral untuk IG Story/TikTok/X Gen Z Indonesia.\n" +
      "Tema: galau, HTS, ghosting, overthinking, atau harapan yang tidak dibalas.\n" +
      "Formula: 1 baris hook yang bikin berhenti scroll, 1-2 baris isi yang makin dalam, 1 baris twist pahit-manis di akhir.\n" +
      "Pola hook: 'POV:', 'Tanda kamu...', 'Yang paling nyakitin itu...', 'Lucunya, ...'.\n" +
      "Larangan: klise dan kata usang (move on, toxic, red flag, baper); jangan menjelaskan atau menasihati panjang.\n" +
      "Batas: maksimal 22 kata, ideal 12-18 kata, 2-3 baris pendek.\n" +
      "Format: balas hanya isi quote, tanpa tanda kutip, tanpa hashtag, tanpa emoji, tanpa penjelasan.",
    sortOrder: 1,
  },
  {
    key: "RANDOM",
    label: "Lucu & Absurd",
    iconName: "laugh",
    themeGradient: "from-amber-500 via-orange-600 to-red-600",
    prompt:
      "Peran: komedian sarkas penulis konten lucu viral untuk IG/TikTok/X Gen Z Indonesia.\n" +
      "Tema: tugas, kerjaan, dompet tipis, atau kelakuan absurd harian.\n" +
      "Formula: 1 baris setup singkat yang relatable, lalu 1-2 baris punchline tak terduga yang bikin ketawa.\n" +
      "Pola hook: 'Ternyata...', 'Gak ada yang bilang...', 'Kalau dipikir-pikir...'.\n" +
      "Larangan: lelucon dan punchline usang; jangan menjelaskan leluconnya.\n" +
      "Batas: maksimal 22 kata, ideal 12-18 kata, 2-3 baris pendek. Boleh hiperbola.\n" +
      "Format: balas hanya isi quote, tanpa tanda kutip, tanpa hashtag, tanpa emoji, tanpa penjelasan.",
    sortOrder: 2,
  },
  {
    key: "MANIFEST",
    label: "Manifest & Grind",
    iconName: "zap",
    themeGradient: "from-emerald-600 via-teal-700 to-cyan-900",
    prompt:
      "Peran: mentor muda penulis konten motivasi viral untuk IG/TikTok/X Gen Z Indonesia.\n" +
      "Tema: fokus naik level, mandiri finansial, dan pembuktian diri (lock in/glow up).\n" +
      "Formula: 1 baris afirmasi atau perintah tegas, 1-2 baris alasan yang menggugah, 1 baris dorongan 'gas' di akhir.\n" +
      "Pola hook: 'Lock in.', 'Satu hari...', 'Berhenti nunggu...', 'Tahun ini...'.\n" +
      "Larangan: motivasi klise dan kata usang (toxic positivity, hustle culture); jangan bertele-tele.\n" +
      "Batas: maksimal 22 kata, ideal 12-18 kata, 2-3 baris pendek.\n" +
      "Format: balas hanya isi quote, tanpa tanda kutip, tanpa hashtag, tanpa emoji, tanpa penjelasan.",
    sortOrder: 3,
  },
  {
    key: "REALTALK",
    label: "Real Talk / POV",
    iconName: "lightbulb",
    themeGradient: "from-blue-700 via-slate-800 to-indigo-950",
    prompt:
      "Peran: pengamat sosial penulis konten Real Talk atau POV viral untuk IG/TikTok/X Gen Z Indonesia.\n" +
      "Tema: pertemanan, kedewasaan, atau pelajaran hidup yang jujur dan ngena.\n" +
      "Formula: 1 baris pengamatan tajam, 1-2 baris pengembangan yang relate, 1 baris insight yang bikin diam sejenak.\n" +
      "Pola hook: 'Semakin dewasa...', 'Pelan-pelan kamu sadar...', 'Yang jarang dibahas...'.\n" +
      "Larangan: klise dan nasihat usang; jangan menggurui atau bertele-tele.\n" +
      "Batas: maksimal 22 kata, ideal 12-18 kata, 2-3 baris pendek.\n" +
      "Format: balas hanya isi quote, tanpa tanda kutip, tanpa hashtag, tanpa emoji, tanpa penjelasan.",
    sortOrder: 4,
  },
];

export const GRADIENT_PRESETS: { label: string; value: string }[] = [
  { label: "Indigo Malam", value: "from-slate-900 via-indigo-950 to-slate-900" },
  { label: "Sunset Lucu", value: "from-amber-500 via-orange-600 to-red-600" },
  { label: "Emerald Grind", value: "from-emerald-600 via-teal-700 to-cyan-900" },
  { label: "Real Talk Blue", value: "from-blue-700 via-slate-800 to-indigo-950" },
  { label: "Neon Ungu", value: "from-indigo-600 to-purple-600" },
  { label: "Pink Senja", value: "from-pink-500 via-rose-600 to-purple-800" },
  { label: "Midnight", value: "from-slate-950 via-slate-900 to-black" },
  { label: "Cyan Glow", value: "from-cyan-500 via-blue-600 to-indigo-900" },
];

export const ICON_OPTIONS = [
  "cloud-rain",
  "laugh",
  "zap",
  "lightbulb",
  "heart",
  "flame",
  "sparkles",
  "moon",
  "star",
  "ghost",
  "coffee",
  "brain",
  "rocket",
  "hand-heart",
  "message-circle",
  "smile",
  "frown",
  "party-popper",
  "dumbbell",
  "book-open",
  "music",
  "sun",
  "snowflake",
  "leaf",
  "bell",
  "thumbs-up",
];

export const CATEGORY_KEY_PATTERN = /^[A-Z0-9_]{2,40}$/;

export const NICKNAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 ._-]{1,23}$/;

export function isValidNickname(value: string): boolean {
  return NICKNAME_PATTERN.test(value.trim());
}
export const DEFAULT_GRADIENT = "from-indigo-600 to-purple-600";

export const GRADIENT_CLASS_SAFELIST = [
  "bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900",
  "bg-linear-to-br from-amber-500 via-orange-600 to-red-600",
  "bg-linear-to-br from-emerald-600 via-teal-700 to-cyan-900",
  "bg-linear-to-br from-blue-700 via-slate-800 to-indigo-950",
  "bg-linear-to-br from-indigo-600 to-purple-600",
  "bg-linear-to-br from-pink-500 via-rose-600 to-purple-800",
  "bg-linear-to-br from-slate-950 via-slate-900 to-black",
  "bg-linear-to-br from-cyan-500 via-blue-600 to-indigo-900",
];

export function gradientClass(value: string | undefined | null): string {
  const candidate = `bg-linear-to-br ${value ?? ""}`.trim();
  return GRADIENT_CLASS_SAFELIST.includes(candidate)
    ? candidate
    : `bg-linear-to-br ${DEFAULT_GRADIENT}`;
}

export function isValidGradient(value: string): boolean {
  const candidate = `bg-linear-to-br ${value}`.trim();
  return GRADIENT_CLASS_SAFELIST.includes(candidate);
}

export function isValidIcon(value: string): boolean {
  return ICON_OPTIONS.includes(value);
}

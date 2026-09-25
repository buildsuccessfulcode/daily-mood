export const BRAND_NAME = "Daily Mood";
export const DEFAULT_WATERMARK = "@dailymood";
export const WATERMARK_SETTING_KEY = "watermark";

export const ADMIN_COOKIE = "dm_admin";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;

export const QUOTE_RETENTION_DAYS = 14;
export const GEMINI_MODEL = "gemini-2.5-flash";
export const GEMINI_MODEL_SETTING_KEY = "gemini_model";

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
      "Kamu adalah konten kreator anak muda. Buat 1 quote galau modern (25-35 kata) tentang HTS, ghosting, atau overthinking anak muda. Bahasa gaul, emosional, mendalam, tanpa alay berlebihan. Balas hanya isi quote tanpa tanda kutip dan tanpa penjelasan.",
    sortOrder: 1,
  },
  {
    key: "RANDOM",
    label: "Lucu & Absurd",
    iconName: "laugh",
    themeGradient: "from-amber-500 via-orange-600 to-red-600",
    prompt:
      "Kamu adalah komedian sarkas. Buat 1 quote lucu dan sarkas (25-35 kata) tentang penderitaan tugas, pekerjaan, atau kelakuan absurd harian anak muda. Balas hanya isi quote tanpa tanda kutip dan tanpa penjelasan.",
    sortOrder: 2,
  },
  {
    key: "MANIFEST",
    label: "Manifest & Grind",
    iconName: "zap",
    themeGradient: "from-emerald-600 via-teal-700 to-cyan-900",
    prompt:
      "Kamu adalah mentor muda. Buat 1 quote motivasi tajam (25-35 kata) tentang fokus nambah skill, mandiri secara finansial, dan pembuktian diri (lock in/glow up) untuk anak muda. Balas hanya isi quote tanpa tanda kutip dan tanpa penjelasan.",
    sortOrder: 3,
  },
  {
    key: "REALTALK",
    label: "Real Talk / POV",
    iconName: "lightbulb",
    themeGradient: "from-blue-700 via-slate-800 to-indigo-950",
    prompt:
      "Kamu adalah pengamat sosial remaja. Buat 1 quote Real Talk atau POV (25-35 kata) tentang kenyataan pertemanan, kedewasaan, atau pelajaran hidup remaja yang jujur. Balas hanya isi quote tanpa tanda kutip dan tanpa penjelasan.",
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

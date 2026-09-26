import { ApiError, GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL } from "./constants";
import type { GeminiModelOption } from "./types";

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [800, 2000];

const VIRAL_SYSTEM_INSTRUCTION =
  "Kamu copywriter konten viral media sosial Indonesia (Instagram, TikTok, X) yang paham selera Gen Z. " +
  "Hasilkan quote orisinal, singkat, berdampak, dan terasa relate. " +
  "Tulis dengan bahasa gaul natural dan tata bahasa Indonesia yang benar. " +
  "Pecah quote menjadi 2-3 baris pendek dengan baris baru di antara baris. " +
  "Pakai sapaan langsung 'kamu' atau 'aku' bila cocok. " +
  "Hindari klise, kata usang (move on, toxic, red flag, baper), dan jangan mengulang ide atau struktur kalimat dari daftar larangan. " +
  "Keluarkan hanya teks quote final tanpa penjelasan, tanpa tanda kutip, tanpa hashtag, tanpa emoji, dan tanpa label.";

export type GenerateQuoteOptions = {
  avoid?: string[];
};

function buildContents(prompt: string, avoid?: string[]): string {
  const blocked = (avoid ?? [])
    .map((text) => text.trim())
    .filter((text) => text.length > 0);
  if (blocked.length === 0) return prompt;
  const list = blocked.map((text) => `- ${text}`).join("\n");
  return `${prompt}\n\nVariasikan jenis pembuka; jangan mengulang pola hook yang sama dengan quote berikut:\n${list}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function statusOf(error: unknown): number | undefined {
  return error instanceof ApiError ? error.status : undefined;
}

function describeError(error: unknown): string {
  const status = statusOf(error);
  const raw = error instanceof Error ? error.message : String(error);
  const detail = raw.replace(/\s+/g, " ").trim().slice(0, 300);
  if (status === 429) {
    return `Gemini gagal (429): kuota/limit tercapai. Cek kuota & billing API key. ${detail}`;
  }
  if (status) return `Gemini gagal (${status}): ${detail}`;
  return `Gemini gagal: ${detail}`;
}

export async function listGeminiModels(
  apiKey: string,
): Promise<GeminiModelOption[]> {
  const ai = new GoogleGenAI({ apiKey });
  const pager = await ai.models.list();
  const seen = new Set<string>();
  const options: GeminiModelOption[] = [];

  for await (const model of pager) {
    const value = (model.name ?? "").replace(/^models\//, "");
    if (!value.startsWith("gemini")) continue;
    const actions = model.supportedActions ?? [];
    if (actions.length > 0 && !actions.includes("generateContent")) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    options.push({
      value,
      label: model.displayName ? `${model.displayName} (${value})` : value,
    });
  }

  return options.sort((a, b) => a.value.localeCompare(b.value));
}

export async function generateQuote(
  apiKey: string,
  prompt: string,
  model: string = GEMINI_MODEL,
  options: GenerateQuoteOptions = {},
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const contents = buildContents(prompt, options.avoid);
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: VIRAL_SYSTEM_INSTRUCTION,
          temperature: 1.0,
          topP: 0.95,
        },
      });
      const text = (response.text ?? "")
        .trim()
        .replace(/^["'“”«»]+|["'“”«»]+$/g, "")
        .trim();
      if (!text) throw new Error("Gemini tidak mengembalikan teks");
      return text.slice(0, 500);
    } catch (error) {
      lastError = error;
      const status = statusOf(error);
      const retryable = status !== undefined && RETRYABLE_STATUS.has(status);
      if (!retryable || attempt === MAX_ATTEMPTS - 1) break;
      await sleep(RETRY_DELAYS_MS[attempt] ?? 2000);
    }
  }

  throw new Error(describeError(lastError));
}

const JOURNAL_SYSTEM_PROMPT = [
  "Kamu adalah 'Daily Companion', teman terpercaya yang ramah, empatis, hangat, dan tidak pernah menggurui untuk anak muda Indonesia.",
  "Tugasmu:",
  "1. Baca rangkuman curhatan harian pengguna.",
  "2. Berikan balasan empati yang tulus dalam 100-150 kata.",
  "3. Struktur balasan: (a) validasi emosi pengguna, (b) soroti hal positif atau pembelajaran kecil dari ceritanya, (c) penutup hangat dan penyemangat istirahat.",
  "4. Gaya bahasa: Bahasa Indonesia gaul santai, ramah, hangat, memakai 'aku' dan 'kamu'. Dilarang memakai bahasa baku seperti surat resmi atau gaya guru BK.",
  "5. Jangan menceramahi, menghakimi, atau memberi nasihat medis.",
  "6. Safety: jika cerita mengindikasikan self-harm atau keinginan mengakhiri hidup, sampaikan empati hangat lalu arahkan dengan sopan ke layanan bantuan krisis kesehatan mental Indonesia (SEJIWA 119 ext 8 atau Into The Light Indonesia).",
  "Balas hanya teks balasan, tanpa label, tanpa tanda kutip, dan tanpa emoji.",
].join("\n");

export type GenerateJournalOptions = {
  nickname?: string | null;
  model?: string;
};

export async function generateJournalResponse(
  apiKey: string,
  mood: string,
  entryText: string,
  options: GenerateJournalOptions = {},
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const model = options.model ?? GEMINI_MODEL;
  const nickname = options.nickname?.trim();
  const systemInstruction = nickname
    ? `${JOURNAL_SYSTEM_PROMPT}\nSapa pengguna dengan panggilan "${nickname}" secara natural satu kali saja.`
    : JOURNAL_SYSTEM_PROMPT;
  const contents = `[Mood hari ini: ${mood}]\n[Curhatan user]: "${entryText}"`;
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: 1.0,
          topP: 0.95,
        },
      });
      const text = (response.text ?? "").trim();
      if (!text) throw new Error("Gemini tidak mengembalikan teks");
      return text.slice(0, 2000);
    } catch (error) {
      lastError = error;
      const status = statusOf(error);
      const retryable = status !== undefined && RETRYABLE_STATUS.has(status);
      if (!retryable || attempt === MAX_ATTEMPTS - 1) break;
      await sleep(RETRY_DELAYS_MS[attempt] ?? 2000);
    }
  }

  throw new Error(describeError(lastError));
}

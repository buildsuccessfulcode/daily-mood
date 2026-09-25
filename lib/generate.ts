import {
  GEMINI_MODEL,
  GEMINI_MODEL_SETTING_KEY,
  QUOTE_RETENTION_DAYS,
  isValidGeminiModel,
} from "./constants";
import { decryptSecret } from "./crypto";
import { generateQuote } from "./gemini";
import { createServiceClient } from "./supabase/server";
import type { GenerateResult } from "./types";

type CategoryRow = {
  id: string;
  key: string;
  prompt: string;
  theme_gradient: string;
  icon_name: string;
};

export async function getGeminiApiKey(): Promise<string | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "gemini_api_key")
    .maybeSingle();
  if (error || !data?.value) return null;
  try {
    return decryptSecret(data.value);
  } catch {
    return null;
  }
}

export async function getGeminiModel(): Promise<string> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", GEMINI_MODEL_SETTING_KEY)
    .maybeSingle();
  if (error || !data?.value) return GEMINI_MODEL;
  const value = data.value.trim();
  return isValidGeminiModel(value) ? value : GEMINI_MODEL;
}

export async function generateDailyQuotes(
  apiKey: string,
  model: string = GEMINI_MODEL,
): Promise<GenerateResult[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, key, prompt, theme_gradient, icon_name")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  const results: GenerateResult[] = [];
  for (const row of (data ?? []) as CategoryRow[]) {
    try {
      const text = await generateQuote(apiKey, row.prompt, model);
      const { error: insertError } = await supabase.from("quotes").insert({
        category_id: row.id,
        text,
        theme_gradient: row.theme_gradient,
        icon_name: row.icon_name,
      });
      if (insertError) throw new Error(insertError.message);
      results.push({ category: row.key, ok: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal generate";
      console.error(`[generate] ${row.key} gagal:`, message);
      results.push({
        category: row.key,
        ok: false,
        error: message.slice(0, 300),
      });
    }
  }
  return results;
}

export async function cleanupOldQuotes(): Promise<number> {
  const supabase = createServiceClient();
  const threshold = new Date(
    Date.now() - QUOTE_RETENTION_DAYS * 86_400_000,
  ).toISOString();
  const { count, error } = await supabase
    .from("quotes")
    .delete({ count: "exact" })
    .lt("created_at", threshold);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

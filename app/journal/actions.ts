"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth-user";
import { getGeminiApiKey, getGeminiModel } from "@/lib/generate";
import { generateJournalResponse } from "@/lib/gemini";
import { validateEntry } from "@/lib/journal";
import { mapJournal } from "@/lib/journal-data";
import { getProfile, greetingName } from "@/lib/profile-data";
import { dateKey } from "@/lib/quotes";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import type { ActionResult } from "@/lib/types";

const ALREADY_TODAY = "Kamu sudah menulis journal hari ini. Sampai jumpa besok!";

export async function submitJournalAction(
  mood: string,
  entryText: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sesi berakhir. Silakan login ulang." };
  }

  const text = entryText.trim();
  const validationError = validateEntry(mood, text);
  if (validationError) return { ok: false, error: validationError };

  const supabase = await createAuthServerClient();
  const journalDate = dateKey();

  const { data: existing } = await supabase
    .from("user_journals")
    .select("id")
    .eq("journal_date", journalDate)
    .maybeSingle();
  if (existing) return { ok: false, error: ALREADY_TODAY };

  const apiKey = await getGeminiApiKey();
  if (!apiKey) {
    return { ok: false, error: "AI key Gemini belum diatur admin." };
  }

  const [model, profile] = await Promise.all([getGeminiModel(), getProfile()]);

  let aiResponse: string;
  try {
    aiResponse = await generateJournalResponse(apiKey, mood, text, {
      nickname: greetingName(profile),
      model,
    });
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "AI gagal membalas. Coba lagi sebentar lagi.",
    };
  }

  const { data, error } = await supabase
    .from("user_journals")
    .insert({
      user_id: user.id,
      journal_date: journalDate,
      mood,
      entry_text: text,
      ai_response: aiResponse,
    })
    .select("id, journal_date, mood, entry_text, ai_response, created_at")
    .single();

  if (error) {
    if (error.code === "23505") return { ok: false, error: ALREADY_TODAY };
    return { ok: false, error: "Gagal menyimpan journal. Coba lagi." };
  }

  revalidatePath("/journal");
  return {
    ok: true,
    message: "Journal tersimpan.",
    data: mapJournal(data),
  };
}

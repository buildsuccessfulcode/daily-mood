import { JOURNAL_HISTORY_DAYS } from "./constants";
import { dateKey, shiftDateKey } from "./quotes";
import { createAuthServerClient } from "./supabase/auth-server";
import type { JournalEntry, MoodHistoryItem, MoodType } from "./types";

type JournalRow = {
  id: string;
  journal_date: string;
  mood: MoodType;
  entry_text: string;
  ai_response: string;
  created_at: string;
};

export function mapJournal(row: JournalRow): JournalEntry {
  return {
    id: row.id,
    journalDate: row.journal_date,
    mood: row.mood,
    entryText: row.entry_text,
    aiResponse: row.ai_response,
    createdAt: row.created_at,
  };
}

export async function getTodayJournal(): Promise<JournalEntry | null> {
  const supabase = await createAuthServerClient();
  const { data } = await supabase
    .from("user_journals")
    .select("id, journal_date, mood, entry_text, ai_response, created_at")
    .eq("journal_date", dateKey())
    .maybeSingle();

  if (!data) return null;
  return mapJournal(data as JournalRow);
}

export async function getJournalHistory(
  days = JOURNAL_HISTORY_DAYS,
): Promise<MoodHistoryItem[]> {
  const supabase = await createAuthServerClient();
  const cutoff = shiftDateKey(dateKey(), -(days - 1));
  const { data } = await supabase
    .from("user_journals")
    .select("journal_date, mood")
    .gte("journal_date", cutoff)
    .order("journal_date", { ascending: false });

  return ((data ?? []) as { journal_date: string; mood: MoodType }[]).map(
    (row) => ({ dateKey: row.journal_date, mood: row.mood }),
  );
}

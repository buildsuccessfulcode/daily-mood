import {
  JOURNAL_MAX_WORDS,
  JOURNAL_MIN_WORDS,
  MOOD_OPTIONS,
} from "./constants";
import { dateKey, shiftDateKey, startOfDayJakarta } from "./quotes";
import type { MoodHistoryItem, MoodType } from "./types";

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function isMood(value: string): value is MoodType {
  return MOOD_OPTIONS.some((option) => option.value === value);
}

export function validateEntry(mood: string, text: string): string | null {
  if (!isMood(mood)) return "Pilih mood hari ini dulu ya.";
  const words = countWords(text);
  if (words < JOURNAL_MIN_WORDS) {
    return `Tulis minimal ${JOURNAL_MIN_WORDS} kata dulu ya (sekarang ${words}).`;
  }
  if (words > JOURNAL_MAX_WORDS) {
    return `Tulis maksimal ${JOURNAL_MAX_WORDS} kata (sekarang ${words}).`;
  }
  return null;
}

export function nextResetWIB(from: Date = new Date()): Date {
  return startOfDayJakarta(1, from);
}

export function moodByDate(items: MoodHistoryItem[]): Map<string, MoodType> {
  return new Map(items.map((item) => [item.dateKey, item.mood]));
}

export function recentDateKeys(
  days: number,
  today: string = dateKey(),
): string[] {
  return Array.from({ length: days }, (_, index) =>
    shiftDateKey(today, -(days - 1 - index)),
  );
}

export type MoodSummary = {
  recordedDays: number;
  totalDays: number;
  currentStreak: number;
  topMood: MoodType | null;
};

export function moodSummary(
  items: MoodHistoryItem[],
  days: number,
  today: string = dateKey(),
): MoodSummary {
  const keys = new Set(recentDateKeys(days, today));
  const moods = moodByDate(items.filter((item) => keys.has(item.dateKey)));

  let currentStreak = 0;
  let cursor = moods.has(today) ? today : shiftDateKey(today, -1);
  while (moods.has(cursor)) {
    currentStreak += 1;
    cursor = shiftDateKey(cursor, -1);
  }

  const counts = new Map<MoodType, number>();
  for (const mood of moods.values()) {
    counts.set(mood, (counts.get(mood) ?? 0) + 1);
  }

  let topMood: MoodType | null = null;
  let topCount = 0;
  for (const [mood, count] of counts) {
    if (count > topCount) {
      topMood = mood;
      topCount = count;
    }
  }

  return {
    recordedDays: moods.size,
    totalDays: days,
    currentStreak,
    topMood,
  };
}

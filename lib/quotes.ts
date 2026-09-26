import { HISTORY_DAYS } from "./constants";
import type { Quote } from "./types";

export const TZ = "Asia/Jakarta";
const JAKARTA_OFFSET_MS = 7 * 3_600_000;

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dayLabelFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: TZ,
  weekday: "short",
  day: "numeric",
  month: "short",
});

export function dateKey(date: Date = new Date()): string {
  return dateKeyFormatter.format(date);
}

export function shiftDateKey(key: string, days: number): string {
  const [year, month, day] = key.split("-").map(Number);
  const shifted = Date.UTC(year, month - 1, day) + days * 86_400_000;
  return dateKey(new Date(shifted));
}

export function startOfDayJakarta(
  offsetDays = 0,
  from: Date = new Date(),
): Date {
  const [year, month, day] = dateKey(from).split("-").map(Number);
  const base = Date.UTC(year, month - 1, day) + offsetDays * 86_400_000;
  return new Date(base - JAKARTA_OFFSET_MS);
}

export function historyCutoffISO(from: Date = new Date()): string {
  return startOfDayJakarta(-(HISTORY_DAYS - 1), from).toISOString();
}

export function groupQuotesByDay(quotes: Quote[]): Map<string, Quote[]> {
  const groups = new Map<string, Quote[]>();
  for (const quote of quotes) {
    const key = dateKey(new Date(quote.createdAt));
    const list = groups.get(key);
    if (list) list.push(quote);
    else groups.set(key, [quote]);
  }
  return groups;
}

export function pickLatestPerCategory(quotes: Quote[]): Map<string, Quote> {
  const latest = new Map<string, Quote>();
  for (const quote of quotes) {
    const existing = latest.get(quote.categoryId);
    if (
      !existing ||
      new Date(quote.createdAt).getTime() >
        new Date(existing.createdAt).getTime()
    ) {
      latest.set(quote.categoryId, quote);
    }
  }
  return latest;
}

export function dayLabel(key: string, todayKey: string): string {
  if (key === todayKey) return "Hari ini";
  if (key === shiftDateKey(todayKey, -1)) return "Kemarin";
  return dayLabelFormatter.format(new Date(`${key}T00:00:00+07:00`));
}

export function formatQuoteDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

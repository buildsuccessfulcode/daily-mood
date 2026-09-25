import type { Quote } from "./types";

export function groupByCategory(quotes: Quote[]): Map<string, Quote[]> {
  const groups = new Map<string, Quote[]>();
  for (const quote of quotes) {
    const list = groups.get(quote.categoryId);
    if (list) list.push(quote);
    else groups.set(quote.categoryId, [quote]);
  }
  return groups;
}

function dayNumber(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
}

export function pickDailyQuote(
  quotes: Quote[],
  date: Date = new Date(),
): Quote | null {
  if (quotes.length === 0) return null;
  const sorted = [...quotes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return sorted[dayNumber(date) % sorted.length];
}

export function formatQuoteDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

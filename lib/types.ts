export type Category = {
  id: string;
  key: string;
  label: string;
  iconName: string;
  themeGradient: string;
  prompt: string;
  sortOrder: number;
  isActive: boolean;
};

export type Quote = {
  id: string;
  categoryId: string;
  text: string;
  themeGradient: string;
  iconName: string;
  createdAt: string;
};

export type QuoteCardData = {
  category: Category;
  quote: Quote;
};

export type DayCard = {
  dateKey: string;
  label: string;
  hasQuotes: boolean;
  cards: QuoteCardData[];
};

export type AdminQuote = {
  id: string;
  text: string;
  categoryId: string;
  categoryKey: string;
  categoryLabel: string;
  categoryIcon: string;
  categoryGradient: string;
  createdAt: string;
};

export type AdminUser = {
  id: string;
  username: string;
  lastLoginAt: string | null;
};

export type MoodType = "SAD" | "TIRED" | "NEUTRAL" | "HAPPY" | "EXCITED";

export type MoodOption = {
  value: MoodType;
  emoji: string;
  label: string;
  hint: string;
};

export type JournalEntry = {
  id: string;
  journalDate: string;
  mood: MoodType;
  entryText: string;
  aiResponse: string;
  createdAt: string;
};

export type MoodHistoryItem = {
  dateKey: string;
  mood: MoodType;
};

export type Profile = {
  id: string;
  nickname: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export type ActionResult =
  | { ok: true; message?: string; data?: unknown }
  | { ok: false; error: string };

export type CategoryInput = {
  id?: string;
  key: string;
  label: string;
  iconName: string;
  themeGradient: string;
  prompt: string;
  sortOrder: number;
  isActive: boolean;
};

export type GenerateResult = {
  category: string;
  ok: boolean;
  error?: string;
};

export type GeminiModelOption = {
  value: string;
  label: string;
};


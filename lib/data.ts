import { isServiceRoleConfigured, isSupabaseConfigured } from "./config";
import {
  ADMIN_USERS_PAGE_SIZE,
  DEFAULT_GRADIENT,
  DEFAULT_WATERMARK,
  GEMINI_MODEL,
  GEMINI_MODEL_SETTING_KEY,
  HISTORY_DAYS,
  WATERMARK_SETTING_KEY,
  isValidGeminiModel,
} from "./constants";
import { decryptSecret, maskSecret } from "./crypto";
import {
  dateKey,
  dayLabel,
  groupQuotesByDay,
  historyCutoffISO,
  pickLatestPerCategory,
  shiftDateKey,
} from "./quotes";
import { createAnonServerClient, createServiceClient } from "./supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdminQuote,
  Category,
  DayCard,
  MoodType,
  Quote,
} from "./types";

type CategoryRow = {
  id: string;
  key: string;
  label: string;
  icon_name: string;
  theme_gradient: string;
  prompt: string;
  sort_order: number;
  is_active: boolean;
};

type QuoteRow = {
  id: string;
  category_id: string;
  text: string;
  theme_gradient: string;
  icon_name: string;
  created_at: string;
};

export function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    iconName: row.icon_name,
    themeGradient: row.theme_gradient,
    prompt: row.prompt,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

export function mapQuote(row: QuoteRow): Quote {
  return {
    id: row.id,
    categoryId: row.category_id,
    text: row.text,
    themeGradient: row.theme_gradient,
    iconName: row.icon_name,
    createdAt: row.created_at,
  };
}

function retentionThreshold(): string {
  return historyCutoffISO();
}

function fallbackQuote(category: Category): Quote {
  return {
    id: `placeholder-${category.id}`,
    categoryId: category.id,
    text:
      "Quote hari ini belum tersedia. Admin bisa membuatnya dari halaman dashboard.",
    themeGradient: category.themeGradient,
    iconName: category.iconName,
    createdAt: new Date().toISOString(),
  };
}

export async function getDailyMood(): Promise<DayCard[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createAnonServerClient();
  const [categoriesResult, quotesResult] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("quotes")
      .select("*")
      .gte("created_at", retentionThreshold())
      .order("created_at", { ascending: false }),
  ]);

  const categories = ((categoriesResult.data ?? []) as CategoryRow[]).map(
    mapCategory,
  );
  const quotes = ((quotesResult.data ?? []) as QuoteRow[]).map(mapQuote);
  const byDay = groupQuotesByDay(quotes);
  const todayKey = dateKey();

  const days: DayCard[] = [];
  for (let offset = 0; offset < HISTORY_DAYS; offset += 1) {
    const key = shiftDateKey(todayKey, -offset);
    const dayQuotes = byDay.get(key) ?? [];
    const latest = pickLatestPerCategory(dayQuotes);
    const cards = categories.map((category) => {
      const picked = latest.get(category.id);
      return { category, quote: picked ?? fallbackQuote(category) };
    });
    days.push({
      dateKey: key,
      label: dayLabel(key, todayKey),
      hasQuotes: dayQuotes.length > 0,
      cards,
    });
  }

  return days;
}

type AdminQuoteRow = {
  id: string;
  text: string;
  created_at: string;
  category_id: string;
  categories:
    | {
        label: string;
        key: string;
        icon_name: string;
        theme_gradient: string;
      }
    | {
        label: string;
        key: string;
        icon_name: string;
        theme_gradient: string;
      }[]
    | null;
};

export async function getQuotesForAdmin(limit = 200): Promise<AdminQuote[]> {
  if (!isServiceRoleConfigured()) return [];
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("quotes")
    .select(
      "id, text, created_at, category_id, categories(label, key, icon_name, theme_gradient)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as unknown as AdminQuoteRow[]).map((row) => {
    const category = Array.isArray(row.categories)
      ? row.categories[0]
      : row.categories;
    return {
      id: row.id,
      text: row.text,
      categoryId: row.category_id,
      categoryKey: category?.key ?? "",
      categoryLabel: category?.label ?? "Tanpa kategori",
      categoryIcon: category?.icon_name ?? "cloud-rain",
      categoryGradient: category?.theme_gradient ?? DEFAULT_GRADIENT,
      createdAt: row.created_at,
    };
  });
}

export async function getWatermark(): Promise<string> {
  if (!isServiceRoleConfigured()) return DEFAULT_WATERMARK;
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", WATERMARK_SETTING_KEY)
      .maybeSingle();
    const value = data?.value?.trim();
    return value && value.length > 0 ? value : DEFAULT_WATERMARK;
  } catch {
    return DEFAULT_WATERMARK;
  }
}

export type UserStats = {
  totalUsers: number;
  usersWithJournal: number;
  totalJournals: number;
  moodCounts: Record<MoodType, number>;
  topMood: MoodType | null;
};

export type AdminOverview = {
  categories: Category[];
  quoteCounts: Record<string, number>;
  totalQuotes: number;
  geminiKeyMasked: string | null;
  geminiKeyFilled: boolean;
  geminiModel: string;
  watermark: string;
  userStats: UserStats;
};

export type AdminUserMoodStat = {
  userId: string;
  nickname: string | null;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  accountCreatedAt: string | null;
  lastSignInAt: string | null;
  hasWrittenJournal: boolean;
  totalEntries: number;
  lastEntryAt: string | null;
  moodCounts: Record<MoodType, number>;
  dominantMood: MoodType | null;
  needsAttention: boolean;
};

const ATTENTION_MOODS: MoodType[] = ["SAD", "TIRED"];
const ATTENTION_WINDOW = 3;
const ATTENTION_THRESHOLD = 2;

const MOOD_VALUES: MoodType[] = [
  "SAD",
  "TIRED",
  "NEUTRAL",
  "HAPPY",
  "EXCITED",
];

function emptyMoodCounts(): Record<MoodType, number> {
  return { SAD: 0, TIRED: 0, NEUTRAL: 0, HAPPY: 0, EXCITED: 0 };
}

function emptyUserStats(): UserStats {
  return {
    totalUsers: 0,
    usersWithJournal: 0,
    totalJournals: 0,
    moodCounts: emptyMoodCounts(),
    topMood: null,
  };
}

function buildUserStats(
  users: { id: string }[],
  journals: { user_id: string; mood: MoodType }[],
): UserStats {
  const moodCounts = emptyMoodCounts();
  const journalUsers = new Set<string>();
  for (const row of journals) {
    if (MOOD_VALUES.includes(row.mood)) {
      moodCounts[row.mood] += 1;
    }
    journalUsers.add(row.user_id);
  }

  let topMood: MoodType | null = null;
  let topCount = 0;
  for (const mood of MOOD_VALUES) {
    if (moodCounts[mood] > topCount) {
      topCount = moodCounts[mood];
      topMood = mood;
    }
  }

  return {
    totalUsers: users.length,
    usersWithJournal: journalUsers.size,
    totalJournals: journals.length,
    moodCounts,
    topMood,
  };
}

export async function getAdminOverview(): Promise<AdminOverview> {
  if (!isServiceRoleConfigured()) {
    return {
      categories: [],
      quoteCounts: {},
      totalQuotes: 0,
      geminiKeyMasked: null,
      geminiKeyFilled: false,
      geminiModel: GEMINI_MODEL,
      watermark: DEFAULT_WATERMARK,
      userStats: emptyUserStats(),
    };
  }
  const supabase = createServiceClient();
  const [categoriesResult, quotesResult, settingsResult, usersResult, journalsResult] =
    await Promise.all([
      supabase.from("categories").select("*").order("sort_order", {
        ascending: true,
      }),
      supabase
        .from("quotes")
        .select("category_id")
        .gte("created_at", retentionThreshold()),
      supabase
        .from("app_settings")
        .select("key, value")
        .in("key", [
          "gemini_api_key",
          WATERMARK_SETTING_KEY,
          GEMINI_MODEL_SETTING_KEY,
        ]),
      supabase.from("profiles").select("id"),
      supabase.from("user_journals").select("user_id, mood"),
    ]);

  const categories = ((categoriesResult.data ?? []) as CategoryRow[]).map(
    mapCategory,
  );

  const quoteCounts: Record<string, number> = {};
  for (const row of (quotesResult.data ?? []) as { category_id: string }[]) {
    quoteCounts[row.category_id] = (quoteCounts[row.category_id] ?? 0) + 1;
  }

  const settings = new Map(
    ((settingsResult.data ?? []) as { key: string; value: string }[]).map(
      (row) => [row.key, row.value],
    ),
  );

  let geminiKeyMasked: string | null = null;
  const geminiKeyValue = settings.get("gemini_api_key");
  if (geminiKeyValue) {
    try {
      geminiKeyMasked = maskSecret(decryptSecret(geminiKeyValue));
    } catch {
      geminiKeyMasked = "••••••••";
    }
  }

  const watermarkValue = settings.get(WATERMARK_SETTING_KEY)?.trim();
  const modelValue = settings.get(GEMINI_MODEL_SETTING_KEY)?.trim();

  const userStats = buildUserStats(
    (usersResult.data ?? []) as { id: string }[],
    (journalsResult.data ?? []) as { user_id: string; mood: MoodType }[],
  );

  return {
    categories,
    quoteCounts,
    totalQuotes: (quotesResult.data ?? []).length,
    geminiKeyMasked,
    geminiKeyFilled: Boolean(geminiKeyValue),
    geminiModel:
      modelValue && isValidGeminiModel(modelValue) ? modelValue : GEMINI_MODEL,
    watermark:
      watermarkValue && watermarkValue.length > 0
        ? watermarkValue
        : DEFAULT_WATERMARK,
    userStats,
  };
}

type ProfileStatRow = {
  id: string;
  nickname: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
};

type JournalStatRow = {
  user_id: string;
  mood: MoodType;
  journal_date: string;
  created_at: string;
};

export type UserMoodStatsPage = {
  users: AdminUserMoodStat[];
  total: number;
  page: number;
  pageSize: number;
};

function sanitizeSearchTerm(value: string): string {
  return value
    .replace(/[^A-Za-z0-9 ._-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type AuthUserInfo = {
  email: string | null;
  lastSignInAt: string | null;
};

async function fetchAuthUsers(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Map<string, AuthUserInfo>> {
  const result = new Map<string, AuthUserInfo>();
  const remaining = new Set(ids);
  if (remaining.size === 0) return result;

  const perPage = 1000;
  try {
    for (let page = 1; page <= 100 && remaining.size > 0; page += 1) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page,
        perPage,
      });
      if (error) break;
      const users = data?.users ?? [];
      for (const user of users) {
        if (remaining.has(user.id)) {
          result.set(user.id, {
            email: user.email ?? null,
            lastSignInAt: user.last_sign_in_at ?? null,
          });
          remaining.delete(user.id);
        }
      }
      if (users.length < perPage) break;
    }
  } catch {
    // Email / login terakhir opsional; abaikan bila gagal.
  }
  return result;
}

export async function getUserMoodStats(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<UserMoodStatsPage> {
  const pageSize = Math.min(
    Math.max(options?.pageSize ?? ADMIN_USERS_PAGE_SIZE, 1),
    100,
  );
  const requestedPage = Math.max(options?.page ?? 1, 1);
  const search = sanitizeSearchTerm(options?.search ?? "");

  if (!isServiceRoleConfigured()) {
    return { users: [], total: 0, page: requestedPage, pageSize };
  }

  const supabase = createServiceClient();

  let profilesQuery = supabase
    .from("profiles")
    .select("id, nickname, display_name, avatar_url, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (search.length > 0) {
    profilesQuery = profilesQuery.or(
      `nickname.ilike.%${search}%,display_name.ilike.%${search}%`,
    );
  }

  const from = (requestedPage - 1) * pageSize;
  const { data: profileData, count } = await profilesQuery.range(
    from,
    from + pageSize - 1,
  );

  const profiles = (profileData ?? []) as ProfileStatRow[];
  const total = count ?? profiles.length;
  if (profiles.length === 0) {
    return { users: [], total, page: requestedPage, pageSize };
  }

  const ids = profiles.map((profile) => profile.id);
  const [journalsResult, authUsers] = await Promise.all([
    supabase
      .from("user_journals")
      .select("user_id, mood, journal_date, created_at")
      .in("user_id", ids)
      .order("journal_date", { ascending: false }),
    fetchAuthUsers(supabase, ids),
  ]);

  const byUser = new Map<
    string,
    {
      totalEntries: number;
      lastEntryAt: string | null;
      moodCounts: Record<MoodType, number>;
      recentMoods: MoodType[];
    }
  >();

  for (const row of (journalsResult.data ?? []) as JournalStatRow[]) {
    let stats = byUser.get(row.user_id);
    if (!stats) {
      stats = {
        totalEntries: 0,
        lastEntryAt: null,
        moodCounts: emptyMoodCounts(),
        recentMoods: [],
      };
      byUser.set(row.user_id, stats);
    }
    stats.totalEntries += 1;
    if (stats.lastEntryAt === null) stats.lastEntryAt = row.created_at;
    if (MOOD_VALUES.includes(row.mood)) {
      stats.moodCounts[row.mood] += 1;
    }
    if (stats.recentMoods.length < ATTENTION_WINDOW) {
      stats.recentMoods.push(row.mood);
    }
  }

  const users = profiles.map((profile) => {
    const journal = byUser.get(profile.id);
    const moodCounts = journal?.moodCounts ?? emptyMoodCounts();
    let dominantMood: MoodType | null = null;
    let topCount = 0;
    for (const mood of MOOD_VALUES) {
      if (moodCounts[mood] > topCount) {
        topCount = moodCounts[mood];
        dominantMood = mood;
      }
    }
    const recentMoods = journal?.recentMoods ?? [];
    const needsAttention =
      recentMoods.length >= ATTENTION_WINDOW &&
      recentMoods.filter((mood) => ATTENTION_MOODS.includes(mood)).length >=
        ATTENTION_THRESHOLD;
    const authUser = authUsers.get(profile.id);

    return {
      userId: profile.id,
      nickname: profile.nickname?.trim() || null,
      displayName: profile.display_name?.trim() || null,
      email: authUser?.email ?? null,
      avatarUrl: profile.avatar_url?.trim() || null,
      accountCreatedAt: profile.created_at ?? null,
      lastSignInAt: authUser?.lastSignInAt ?? null,
      hasWrittenJournal: (journal?.totalEntries ?? 0) > 0,
      totalEntries: journal?.totalEntries ?? 0,
      lastEntryAt: journal?.lastEntryAt ?? null,
      moodCounts,
      dominantMood,
      needsAttention,
    } satisfies AdminUserMoodStat;
  });

  users.sort((a, b) => {
    if (a.needsAttention !== b.needsAttention) {
      return a.needsAttention ? -1 : 1;
    }
    if (b.totalEntries !== a.totalEntries) {
      return b.totalEntries - a.totalEntries;
    }
    return (b.lastSignInAt ?? "").localeCompare(a.lastSignInAt ?? "");
  });

  return { users, total, page: requestedPage, pageSize };
}

import { isServiceRoleConfigured, isSupabaseConfigured } from "./config";
import {
  DEFAULT_GRADIENT,
  DEFAULT_WATERMARK,
  GEMINI_MODEL,
  GEMINI_MODEL_SETTING_KEY,
  QUOTE_RETENTION_DAYS,
  WATERMARK_SETTING_KEY,
  isValidGeminiModel,
} from "./constants";
import { decryptSecret, maskSecret } from "./crypto";
import { groupByCategory, pickDailyQuote } from "./quotes";
import { createAnonServerClient, createServiceClient } from "./supabase/server";
import type { AdminQuote, Category, Quote, QuoteCardData } from "./types";

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
  return new Date(
    Date.now() - QUOTE_RETENTION_DAYS * 86_400_000,
  ).toISOString();
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

export async function getDailyCards(): Promise<QuoteCardData[]> {
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
  const grouped = groupByCategory(quotes);

  return categories.map((category) => {
    const picked = pickDailyQuote(grouped.get(category.id) ?? []);
    return { category, quote: picked ?? fallbackQuote(category) };
  });
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

export type AdminOverview = {
  categories: Category[];
  quoteCounts: Record<string, number>;
  totalQuotes: number;
  geminiKeyMasked: string | null;
  geminiKeyFilled: boolean;
  geminiModel: string;
  watermark: string;
};

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
    };
  }
  const supabase = createServiceClient();
  const [categoriesResult, quotesResult, settingsResult] = await Promise.all([
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
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  checkRateLimit,
  clearAdminSession,
  getAdminId,
  hashPassword,
  setAdminSession,
  verifyPassword,
} from "@/lib/auth";
import {
  CATEGORY_KEY_PATTERN,
  DEFAULT_CATEGORIES,
  GEMINI_MODEL_SETTING_KEY,
  WATERMARK_SETTING_KEY,
  isValidGeminiModel,
  isValidGradient,
  isValidIcon,
} from "@/lib/constants";
import { encryptSecret, isEncryptionConfigured } from "@/lib/crypto";
import { listGeminiModels } from "@/lib/gemini";
import {
  cleanupOldQuotes,
  generateDailyQuotes,
  getGeminiApiKey,
  getGeminiModel,
} from "@/lib/generate";
import { createServiceClient } from "@/lib/supabase/server";
import type { ActionResult, CategoryInput } from "@/lib/types";

function noAuth(): ActionResult {
  return { ok: false, error: "Sesi berakhir. Silakan login ulang." };
}

function validateCategory(input: CategoryInput): string | null {
  if (!CATEGORY_KEY_PATTERN.test(input.key.trim().toUpperCase())) {
    return "Key kategori harus 2-40 karakter (A-Z, 0-9, _).";
  }
  const label = input.label.trim();
  if (label.length < 1 || label.length > 80) {
    return "Label wajib 1-80 karakter.";
  }
  if (!isValidIcon(input.iconName)) return "Ikon tidak valid.";
  if (!isValidGradient(input.themeGradient)) return "Gradient tidak valid.";
  const prompt = input.prompt.trim();
  if (prompt.length < 1 || prompt.length > 1200) {
    return "Prompt wajib 1-1200 karakter.";
  }
  if (!Number.isFinite(Number(input.sortOrder))) {
    return "Urutan tidak valid.";
  }
  return null;
}

export async function loginAction(
  usernameRaw: string,
  passwordRaw: string,
): Promise<ActionResult> {
  const username = usernameRaw.trim().toLowerCase();
  const password = passwordRaw;
  if (!username || !password) {
    return { ok: false, error: "Username dan password wajib diisi." };
  }

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!checkRateLimit(`login:${ip}`, 6, 60_000)) {
    return { ok: false, error: "Terlalu banyak percobaan. Tunggu 1 menit." };
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("admins")
      .select("id, password_hash")
      .eq("username", username)
      .maybeSingle();

    if (error) return { ok: false, error: "Gagal mengakses database." };
    if (!data || !verifyPassword(password, data.password_hash)) {
      return { ok: false, error: "Username atau password salah." };
    }

    await supabase
      .from("admins")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", data.id);
    await setAdminSession(data.id);
    return { ok: true, message: "Berhasil masuk." };
  } catch {
    return { ok: false, error: "Konfigurasi server belum lengkap." };
  }
}

export async function logoutAction(): Promise<ActionResult> {
  await clearAdminSession();
  revalidatePath("/admin");
  return { ok: true, message: "Berhasil keluar." };
}

export async function saveGeminiKeyAction(apiKey: string): Promise<ActionResult> {
  if (!(await getAdminId())) return noAuth();
  const key = apiKey.trim();
  if (key.length < 15 || key.length > 400) {
    return { ok: false, error: "API key terlihat tidak valid." };
  }
  if (!isEncryptionConfigured()) {
    return { ok: false, error: "APP_ENCRYPTION_KEY belum diatur di server." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("app_settings").upsert(
    { key: "gemini_api_key", value: encryptSecret(key) },
    { onConflict: "key" },
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true, message: "AI key tersimpan terenkripsi." };
}

export async function saveGeminiModelAction(
  model: string,
): Promise<ActionResult> {
  if (!(await getAdminId())) return noAuth();
  const value = model.trim();
  if (!isValidGeminiModel(value)) {
    return { ok: false, error: "Model Gemini tidak valid." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("app_settings").upsert(
    { key: GEMINI_MODEL_SETTING_KEY, value },
    { onConflict: "key" },
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true, message: `Model Gemini diatur ke ${value}.` };
}

export async function listGeminiModelsAction(): Promise<ActionResult> {
  if (!(await getAdminId())) return noAuth();
  const apiKey = await getGeminiApiKey();
  if (!apiKey) {
    return { ok: false, error: "AI key Gemini belum diatur." };
  }
  try {
    const models = await listGeminiModels(apiKey);
    if (models.length === 0) {
      return { ok: false, error: "Tidak ada model Gemini yang tersedia." };
    }
    return { ok: true, data: models };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal mengambil daftar model.",
    };
  }
}

export async function deleteGeminiKeyAction(): Promise<ActionResult> {
  if (!(await getAdminId())) return noAuth();
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("app_settings")
    .delete()
    .eq("key", "gemini_api_key");
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true, message: "AI key dihapus." };
}

export async function saveWatermarkAction(
  watermarkRaw: string,
): Promise<ActionResult> {
  if (!(await getAdminId())) return noAuth();
  const watermark = watermarkRaw.trim();
  if (watermark.length < 1 || watermark.length > 60) {
    return { ok: false, error: "Watermark wajib 1-60 karakter." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("app_settings").upsert(
    { key: WATERMARK_SETTING_KEY, value: watermark },
    { onConflict: "key" },
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true, message: "Watermark diperbarui." };
}

export async function saveCategoryAction(
  input: CategoryInput,
): Promise<ActionResult> {
  if (!(await getAdminId())) return noAuth();
  const validationError = validateCategory(input);
  if (validationError) return { ok: false, error: validationError };

  const payload = {
    key: input.key.trim().toUpperCase(),
    label: input.label.trim(),
    icon_name: input.iconName,
    theme_gradient: input.themeGradient,
    prompt: input.prompt.trim(),
    sort_order: Math.trunc(Number(input.sortOrder)),
    is_active: Boolean(input.isActive),
  };

  const supabase = createServiceClient();
  if (input.id) {
    const { error } = await supabase
      .from("categories")
      .update(payload)
      .eq("id", input.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("categories").insert(payload);
    if (error) {
      return {
        ok: false,
        error:
          error.code === "23505"
            ? "Key kategori sudah dipakai."
            : error.message,
      };
    }
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return {
    ok: true,
    message: input.id ? "Kategori diperbarui." : "Kategori ditambahkan.",
  };
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  if (!(await getAdminId())) return noAuth();
  if (!id) return { ok: false, error: "ID kategori tidak valid." };

  const supabase = createServiceClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true, message: "Kategori dihapus." };
}

export async function generateNowAction(): Promise<ActionResult> {
  if (!(await getAdminId())) return noAuth();
  try {
    const [apiKey, model] = await Promise.all([
      getGeminiApiKey(),
      getGeminiModel(),
    ]);
    if (!apiKey) {
      return { ok: false, error: "AI key Gemini belum diatur." };
    }
    const results = await generateDailyQuotes(apiKey, model);
    revalidatePath("/");
    revalidatePath("/admin");

    if (results.length === 0) {
      return { ok: false, error: "Tidak ada kategori aktif." };
    }
    const failed = results.filter((result) => !result.ok);
    if (failed.length > 0) {
      const names = failed.map((result) => result.category).join(", ");
      const reason = failed.find((result) => result.error)?.error?.slice(0, 200);
      const detail = reason ? ` Penyebab: ${reason}` : "";
      return {
        ok: true,
        message: `${results.length - failed.length} berhasil, ${failed.length} gagal (${names}).${detail}`,
      };
    }
    return { ok: true, message: `${results.length} quote berhasil dibuat.` };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Gagal generate.",
    };
  }
}

export async function cleanupNowAction(): Promise<ActionResult> {
  if (!(await getAdminId())) return noAuth();
  try {
    const deleted = await cleanupOldQuotes();
    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true, message: `${deleted} quote lama dihapus.` };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Gagal cleanup.",
    };
  }
}

export async function changePasswordAction(
  currentPassword: string,
  newPassword: string,
): Promise<ActionResult> {
  const adminId = await getAdminId();
  if (!adminId) return noAuth();
  if (newPassword.length < 8 || newPassword.length > 128) {
    return { ok: false, error: "Password baru minimal 8 karakter." };
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("admins")
    .select("password_hash")
    .eq("id", adminId)
    .maybeSingle();
  if (error || !data) return { ok: false, error: "Admin tidak ditemukan." };
  if (!verifyPassword(currentPassword, data.password_hash)) {
    return { ok: false, error: "Password saat ini salah." };
  }

  const { error: updateError } = await supabase
    .from("admins")
    .update({ password_hash: hashPassword(newPassword) })
    .eq("id", adminId);
  if (updateError) return { ok: false, error: updateError.message };
  return { ok: true, message: "Password berhasil diganti." };
}

export async function seedDefaultsAction(): Promise<ActionResult> {
  if (!(await getAdminId())) return noAuth();
  const rows = DEFAULT_CATEGORIES.map((category) => ({
    key: category.key,
    label: category.label,
    icon_name: category.iconName,
    theme_gradient: category.themeGradient,
    prompt: category.prompt,
    sort_order: category.sortOrder,
    is_active: true,
  }));

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("categories")
    .upsert(rows, { onConflict: "key", ignoreDuplicates: true });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true, message: "Kategori default dipastikan ada." };
}

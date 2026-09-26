"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAppUrl } from "@/lib/config";
import { safeNextPath } from "@/lib/auth-user";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import type { ActionResult } from "@/lib/types";

async function resolveOrigin(): Promise<string> {
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  if (origin && origin !== "null") return origin;
  return getAppUrl();
}

export async function signInWithGoogleAction(
  nextRaw?: string,
): Promise<ActionResult> {
  const next = safeNextPath(nextRaw);
  try {
    const supabase = await createAuthServerClient();
    const origin = await resolveOrigin();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error || !data.url) {
      return { ok: false, error: "Gagal memulai login Google." };
    }
    return { ok: true, data: { url: data.url } };
  } catch {
    return { ok: false, error: "Konfigurasi server belum lengkap." };
  }
}

export async function signOutAction(): Promise<void> {
  const supabase = await createAuthServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

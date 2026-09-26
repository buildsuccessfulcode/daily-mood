import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { getCurrentUser } from "./auth-user";
import { isServiceRoleConfigured } from "./config";
import { createAuthServerClient } from "./supabase/auth-server";
import { createServiceClient } from "./supabase/server";
import type { Profile } from "./types";

type ProfileRow = {
  id: string;
  nickname: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    nickname: row.nickname?.trim() || null,
    displayName: row.display_name?.trim() || null,
    avatarUrl: row.avatar_url?.trim() || null,
  };
}

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createAuthServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, nickname, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) {
    return {
      id: user.id,
      nickname: null,
      displayName:
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        null,
      avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
    };
  }

  return mapProfile(data as ProfileRow);
});

export function greetingName(profile: Profile | null): string | null {
  if (!profile) return null;
  if (profile.nickname) return profile.nickname;
  if (profile.displayName) {
    const first = profile.displayName.trim().split(/\s+/)[0];
    if (first) return first;
  }
  return null;
}

export async function isNicknameTaken(
  nickname: string,
  exceptUserId?: string,
): Promise<boolean> {
  if (!isServiceRoleConfigured()) return false;
  try {
    const supabase = createServiceClient();
    let query = supabase
      .from("profiles")
      .select("id")
      .ilike("nickname", nickname.trim());
    if (exceptUserId) query = query.neq("id", exceptUserId);
    const { data } = await query.maybeSingle();
    return Boolean(data);
  } catch {
    return false;
  }
}

export function sanitizeNickname(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ._-]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[^A-Za-z0-9]+/, "")
    .slice(0, 24)
    .trim();
}

export function deriveNickname(user: User): string {
  const meta = user.user_metadata ?? {};
  const raw =
    (meta.full_name as string | undefined) ??
    (meta.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "";
  return sanitizeNickname(raw);
}

const FALLBACK_NICKNAME = "Pengguna";

export async function generateUniqueNickname(
  base: string,
  userId: string,
): Promise<string | null> {
  if (!isServiceRoleConfigured()) return null;
  const supabase = createServiceClient();
  const cleaned = sanitizeNickname(base);
  const seed = cleaned.length >= 2 ? cleaned : FALLBACK_NICKNAME;

  for (let attempt = 1; attempt <= 50; attempt += 1) {
    const suffix = attempt === 1 ? "" : String(attempt);
    const candidate = `${seed.slice(0, 24 - suffix.length)}${suffix}`;
    if (await isNicknameTaken(candidate, userId)) continue;

    const { error } = await supabase
      .from("profiles")
      .update({ nickname: candidate })
      .eq("id", userId);
    if (!error) return candidate;
    if (error.code !== "23505") return null;
  }

  const fallback = `${FALLBACK_NICKNAME}${Math.floor(1000 + Math.random() * 9000)}`;
  const { error } = await supabase
    .from("profiles")
    .update({ nickname: fallback })
    .eq("id", userId);
  return error ? null : fallback;
}

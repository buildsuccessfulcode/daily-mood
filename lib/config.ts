function getSupabasePublishableKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function getSupabaseSecretKey(): string | undefined {
  return process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && getSupabasePublishableKey(),
  );
}

export function isServiceRoleConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && getSupabaseSecretKey(),
  );
}

export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL belum diatur");
  return url;
}

export function getSupabaseAnonKey(): string {
  const key = getSupabasePublishableKey();
  if (!key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY atau NEXT_PUBLIC_SUPABASE_ANON_KEY belum diatur",
    );
  }
  return key;
}

export function getSupabaseSecretKeyOrThrow(): string {
  const key = getSupabaseSecretKey();
  if (!key) {
    throw new Error(
      "SUPABASE_SECRET_KEY atau SUPABASE_SERVICE_ROLE_KEY belum diatur",
    );
  }
  return key;
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

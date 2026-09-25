import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseAnonKey,
  getSupabaseSecretKeyOrThrow,
  getSupabaseUrl,
} from "../config";

export function createServiceClient(): SupabaseClient {
  return createClient(getSupabaseUrl(), getSupabaseSecretKeyOrThrow(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createAnonServerClient(): SupabaseClient {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

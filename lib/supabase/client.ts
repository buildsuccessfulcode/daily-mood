import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "../config";

let cached: SupabaseClient | null = null;

export function getBrowserClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase belum dikonfigurasi");
  }
  if (!cached) {
    cached = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}

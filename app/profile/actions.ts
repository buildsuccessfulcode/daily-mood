"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth-user";
import { isValidNickname } from "@/lib/constants";
import { isNicknameTaken } from "@/lib/profile-data";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import type { ActionResult } from "@/lib/types";

export async function updateProfileAction(
  nicknameRaw: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sesi berakhir. Silakan login ulang." };
  }

  const nickname = nicknameRaw.trim();
  if (nickname.length < 2 || nickname.length > 24) {
    return { ok: false, error: "Nama panggilan wajib 2-24 karakter." };
  }
  if (!isValidNickname(nickname)) {
    return {
      ok: false,
      error:
        "Nama panggilan hanya boleh huruf, angka, spasi, titik, garis bawah, dan strip.",
    };
  }
  if (await isNicknameTaken(nickname, user.id)) {
    return { ok: false, error: "Nama panggilan sudah dipakai. Pilih yang lain." };
  }

  try {
    const supabase = await createAuthServerClient();
    const { error } = await supabase
      .from("profiles")
      .update({ nickname })
      .eq("id", user.id);
    if (error) {
      if (error.code === "23505") {
        return {
          ok: false,
          error: "Nama panggilan sudah dipakai. Pilih yang lain.",
        };
      }
      return { ok: false, error: "Gagal menyimpan. Coba lagi." };
    }
    revalidatePath("/");
    revalidatePath("/journal");
    revalidatePath("/profile");
    return { ok: true, message: "Profil diperbarui." };
  } catch {
    return { ok: false, error: "Konfigurasi server belum lengkap." };
  }
}

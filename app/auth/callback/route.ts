import { NextResponse } from "next/server";
import { safeNextPath } from "@/lib/auth-user";
import { deriveNickname, generateUniqueNickname } from "@/lib/profile-data";
import { createAuthServerClient } from "@/lib/supabase/auth-server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createAuthServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const user = data.user;
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile?.nickname) {
          await generateUniqueNickname(deriveNickname(user), user.id);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}

import { LogOut } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Avatar } from "@/components/profile/Avatar";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { signOutAction } from "@/app/auth/actions";
import { requireUserPage } from "@/lib/auth-user";
import { getProfile } from "@/lib/profile-data";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUserPage("/profile");
  const profile = await getProfile();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 pt-8 pb-8">
      <SiteHeader />

      <div className="flex flex-col items-center gap-3 text-center">
        <Avatar profile={profile} email={user.email} size={72} />
        <div>
          <h1 className="text-lg font-extrabold">
            {profile?.nickname ?? "Profil"}
          </h1>
          <p className="break-all text-xs text-white/50">{user.email}</p>
        </div>
      </div>

      <ProfileForm
        initialNickname={profile?.nickname ?? ""}
        email={user.email ?? ""}
      />

      <form action={signOutAction} className="sm:hidden">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </button>
      </form>

      <footer className="pb-4 text-center text-[11px] text-white/40">
        Foto profil diambil dari akun Google-mu bila ada. Kalau tidak, kami
        tampilkan inisial namamu.
      </footer>
    </div>
  );
}

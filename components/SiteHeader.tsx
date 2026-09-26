import Link from "next/link";
import { LogOut } from "lucide-react";
import { Avatar } from "@/components/profile/Avatar";
import { Logo } from "@/components/Logo";
import { MobileMenu } from "@/components/MobileMenu";
import { signOutAction } from "@/app/auth/actions";
import { getCurrentUser } from "@/lib/auth-user";
import { getProfile } from "@/lib/profile-data";
import { cn } from "@/lib/utils";

const NAV_LINK =
  "rounded-full border border-white/15 bg-white/5 px-3 py-1.5 transition hover:bg-white/10";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const profile = user ? await getProfile() : null;
  const label =
    profile?.nickname ?? profile?.displayName ?? user?.email ?? "Akun";

  return (
    <header className="flex items-center justify-between gap-2 sm:gap-3">
      <Link href="/" className="flex min-w-0 items-center gap-2">
        <Logo size={36} />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-extrabold tracking-wide">
            Daily Mood
          </p>
          <p className="hidden text-[11px] text-white/50 sm:block">
            Quote & journal harian
          </p>
        </div>
      </Link>

      <nav className="hidden items-center gap-2 text-xs font-semibold text-white/70 sm:flex">
        <Link href="/" className={cn(NAV_LINK, "whitespace-nowrap")}>
          Quote
        </Link>
        <Link href="/journal" className={cn(NAV_LINK, "whitespace-nowrap")}>
          Journal
        </Link>

        {user ? (
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1 pl-1 pr-2.5 transition hover:bg-white/10 sm:pr-3"
            >
              <Avatar profile={profile} email={user.email} size={26} />
              <span className="hidden max-w-[120px] truncate md:inline">
                {label}
              </span>
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                title="Keluar"
                aria-label="Keluar"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/10 sm:h-8 sm:w-8"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/login"
            className="whitespace-nowrap rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-1.5 text-white transition hover:brightness-110"
          >
            Masuk
          </Link>
        )}
      </nav>

      <MobileMenu
        authed={Boolean(user)}
        profile={profile}
        email={user?.email}
        label={label}
      />
    </header>
  );
}

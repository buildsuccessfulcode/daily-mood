"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookHeart, LogOut, Menu, Quote, X } from "lucide-react";
import { Avatar } from "@/components/profile/Avatar";
import { signOutAction } from "@/app/auth/actions";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

type MobileMenuProps = {
  authed: boolean;
  profile: Profile | null;
  email?: string | null;
  label: string;
};

export function MobileMenu({ authed, profile, email, label }: MobileMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const links = [
    {
      href: "/",
      label: "Quote",
      active: pathname === "/",
      icon: Quote,
    },
    {
      href: "/journal",
      label: "Journal",
      active: pathname.startsWith("/journal"),
      icon: BookHeart,
    },
  ];

  return (
    <div ref={ref} className="relative sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Tutup menu" : "Buka menu"}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/10"
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b16]/95 p-2 shadow-xl backdrop-blur-md">
          {authed ? (
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="mb-1 flex items-center gap-2 rounded-xl px-2 py-2 transition hover:bg-white/5"
            >
              <Avatar profile={profile} email={email} size={28} />
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-white/80">
                {label}
              </span>
            </Link>
          ) : null}

          <div className="flex flex-col">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={link.active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-2 py-2 text-xs font-semibold transition",
                    link.active
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:bg-white/5 hover:text-white/80",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}

            {authed ? null : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="mt-1 flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-2 text-xs font-bold text-white transition hover:brightness-110"
              >
                Masuk
              </Link>
            )}
          </div>

          {authed ? (
            <form
              action={signOutAction}
              className="mt-1 border-t border-white/10 pt-1"
            >
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/5 hover:text-white/80"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

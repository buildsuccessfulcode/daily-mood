import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

function initials(
  name: string | null | undefined,
  email: string | null | undefined,
): string {
  const source = name?.trim() || email?.trim() || "?";
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  const chars = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return chars || "?";
}

type AvatarProps = {
  profile: Profile | null;
  email?: string | null;
  size?: number;
  className?: string;
};

export function Avatar({ profile, email, size = 32, className }: AvatarProps) {
  const name = profile?.nickname ?? profile?.displayName ?? null;
  const url = profile?.avatarUrl ?? null;

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name ?? "Foto profil"}
        width={size}
        height={size}
        loading="lazy"
        referrerPolicy="no-referrer"
        className={cn("rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 font-bold text-white",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials(name, email)}
    </span>
  );
}

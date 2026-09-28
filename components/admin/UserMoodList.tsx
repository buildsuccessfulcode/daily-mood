"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/profile/Avatar";
import { MOOD_OPTIONS } from "@/lib/constants";
import type { AdminUserMoodStat, UserMoodStatsPage } from "@/lib/data";
import { TZ } from "@/lib/quotes";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-indigo-400";

type FilterKey = "ALL" | "ATTENTION" | "NO_JOURNAL";

const FILTER_LABEL: Record<FilterKey, string> = {
  ALL: "Semua user",
  ATTENTION: "Perlu perhatian",
  NO_JOURNAL: "Belum menulis diary",
};

function formatDateTime(
  value: string | null,
  fallback = "-",
): string {
  if (!value) return fallback;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatEntryAt(value: string | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDateOnly(value: string | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function displayName(user: AdminUserMoodStat): string {
  return user.nickname ?? user.displayName ?? "Pengguna";
}

function pageNumbers(current: number, totalPages: number): (number | "…")[] {
  const pages = new Set<number>([1, totalPages]);
  for (let i = current - 1; i <= current + 1; i += 1) {
    if (i >= 1 && i <= totalPages) pages.add(i);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  let prev = 0;
  for (const value of sorted) {
    if (prev !== 0 && value - prev > 1) result.push("…");
    result.push(value);
    prev = value;
  }
  return result;
}

type UserMoodListProps = UserMoodStatsPage & { initialQuery: string };

export function UserMoodList({
  users,
  total,
  page,
  pageSize,
  initialQuery,
}: UserMoodListProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [term, setTerm] = useState(initialQuery);
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const go = (nextPage: number, nextQuery = term) => {
    const params = new URLSearchParams();
    const trimmed = nextQuery.trim();
    if (trimmed) params.set("q", trimmed);
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/admin/users?${qs}` : "/admin/users");
    });
  };

  const filtered = useMemo(() => {
    return users.filter((user) => {
      if (filter === "ATTENTION") return user.needsAttention;
      if (filter === "NO_JOURNAL") return !user.hasWrittenJournal;
      return true;
    });
  }, [users, filter]);

  const pageAttention = useMemo(
    () => users.filter((user) => user.needsAttention).length,
    [users],
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
        </Link>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Daftar User</h1>
          <p className="text-xs text-white/50">
            {total} akun terdaftar · halaman {page} dari {totalPages}
          </p>
        </div>
      </header>

      <div className="flex items-start gap-2.5 rounded-2xl border border-amber-300/20 bg-amber-400/5 px-4 py-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
        <p className="text-xs text-white/70">
          Data ini untuk pendampingan peserta didik. Isi diary user tidak
          diakses dari halaman ini.
        </p>
      </div>

      <section className="flex flex-col gap-3 sm:flex-row">
        <form onSubmit={(event) => {
          event.preventDefault();
          go(1);
        }} className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Cari nickname atau nama..."
            className={cn(inputClass, "pl-9")}
          />
        </form>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as FilterKey)}
          className={cn(inputClass, "sm:w-52")}
        >
          {(["ALL", "ATTENTION", "NO_JOURNAL"] as FilterKey[]).map((key) => (
            <option key={key} value={key}>
              {FILTER_LABEL[key]}
            </option>
          ))}
        </select>
      </section>

      {filter !== "ALL" ? (
        <p className="-mt-3 text-[11px] text-white/40">
          Filter “{FILTER_LABEL[filter]}” berlaku untuk halaman ini ({users.length}{" "}
          user). Pencarian berlaku untuk semua user.
        </p>
      ) : pageAttention > 0 ? (
        <p className="-mt-3 text-[11px] text-white/40">
          {pageAttention} user di halaman ini perlu perhatian.
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center">
          <Users className="h-10 w-10 text-indigo-300" />
          <p className="text-lg font-semibold">Tidak ada user</p>
          <p className="max-w-sm text-sm text-white/60">
            {total === 0
              ? "Belum ada akun yang cocok dengan pencarian."
              : filter === "ALL"
                ? "Belum ada akun yang terdaftar."
                : `Tidak ada user “${FILTER_LABEL[filter]}” di halaman ini.`}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((user) => {
            const isOpen = expanded === user.userId;
            return (
              <li
                key={user.userId}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start gap-3">
                  <Avatar
                    profile={{
                      id: user.userId,
                      nickname: user.nickname,
                      displayName: user.displayName,
                      avatarUrl: user.avatarUrl,
                    }}
                    size={40}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">
                        {displayName(user)}
                      </p>
                      {user.needsAttention ? (
                        <span className="flex items-center gap-1 rounded-full bg-red-400/15 px-2 py-0.5 text-[10px] font-bold text-red-200">
                          <AlertTriangle className="h-3 w-3" /> Perlu perhatian
                        </span>
                      ) : null}
                    </div>
                    {user.email ? (
                      <p className="mt-0.5 truncate text-[11px] text-white/40">
                        {user.email}
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-[11px] text-white/50">
                      Login terakhir:{" "}
                      {formatDateTime(user.lastSignInAt, "Belum pernah")} · Dibuat:{" "}
                      {formatDateOnly(
                        user.accountCreatedAt
                          ? user.accountCreatedAt.slice(0, 10)
                          : null,
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl border border-white/10 bg-black/20 px-2 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-white/50">
                      Entri
                    </p>
                    <p className="text-sm font-bold">{user.totalEntries}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-2 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-white/50">
                      Mood Dominan
                    </p>
                    <p className="text-sm font-bold">
                      {user.dominantMood
                        ? (MOOD_OPTIONS.find(
                            (option) => option.value === user.dominantMood,
                          )?.emoji ?? "-")
                        : "-"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-2 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-white/50">
                      Entri Terakhir (WIB)
                    </p>
                    <p className="text-sm font-bold">
                      {formatEntryAt(user.lastEntryAt)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : user.userId)}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10"
                >
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      isOpen && "rotate-180",
                    )}
                  />
                  {isOpen ? "Sembunyikan mood" : "Lihat semua mood"}
                </button>

                {isOpen ? (
                  user.totalEntries === 0 ? (
                    <p className="mt-3 text-center text-xs text-white/50">
                      User ini belum menulis diary.
                    </p>
                  ) : (
                    <div className="mt-3 flex flex-col gap-2.5">
                      {MOOD_OPTIONS.map((option) => {
                        const count = user.moodCounts[option.value];
                        const percent =
                          user.totalEntries > 0
                            ? Math.round((count / user.totalEntries) * 100)
                            : 0;
                        const isTop =
                          user.dominantMood === option.value && count > 0;
                        return (
                          <div
                            key={option.value}
                            className="flex items-center gap-3"
                          >
                            <span className="w-7 text-center text-base">
                              {option.emoji}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center justify-between gap-2">
                                <span className="truncate text-xs font-semibold">
                                  {option.label}
                                </span>
                                <span className="shrink-0 text-[11px] text-white/50">
                                  {count} · {percent}%
                                </span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                                <div
                                  className={cn(
                                    "h-full rounded-full",
                                    isTop
                                      ? "bg-indigo-400"
                                      : "bg-indigo-400/50",
                                  )}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 ? (
        <nav className="flex flex-wrap items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => go(Math.max(1, page - 1))}
            disabled={page <= 1 || pending}
            className="flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Sebelumnya
          </button>
          {pageNumbers(page, totalPages).map((value, index) =>
            value === "…" ? (
              <span
                key={`ellipsis-${index}`}
                className="px-2 text-xs text-white/40"
              >
                …
              </span>
            ) : (
              <button
                key={value}
                type="button"
                onClick={() => go(value)}
                disabled={pending}
                className={cn(
                  "min-w-8 rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40",
                  value === page
                    ? "border-indigo-400 bg-indigo-500 text-white"
                    : "border-white/15 text-white/70 hover:bg-white/10",
                )}
              >
                {value}
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() => go(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || pending}
            className="flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 disabled:opacity-40"
          >
            Berikutnya <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </nav>
      ) : null}
    </div>
  );
}

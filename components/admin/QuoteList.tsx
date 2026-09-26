"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clipboard, Quote as QuoteIcon, Search } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { useToast } from "@/components/ui/Toast";
import { QUOTE_RETENTION_DAYS, gradientClass } from "@/lib/constants";
import type { AdminQuote } from "@/lib/types";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-indigo-400";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function QuoteList({ quotes }: { quotes: AdminQuote[] }) {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [categoryKey, setCategoryKey] = useState("ALL");

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const quote of quotes) {
      map.set(quote.categoryKey || "UNCATEGORIZED", quote.categoryLabel);
    }
    return [...map.entries()];
  }, [quotes]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return quotes.filter((quote) => {
      const matchCategory =
        categoryKey === "ALL" ||
        (quote.categoryKey || "UNCATEGORIZED") === categoryKey;
      const matchTerm =
        term.length === 0 ||
        quote.text.toLowerCase().includes(term) ||
        quote.categoryLabel.toLowerCase().includes(term);
      return matchCategory && matchTerm;
    });
  }, [quotes, query, categoryKey]);

  const handleCopy = async (quote: AdminQuote) => {
    try {
      await navigator.clipboard.writeText(`"${quote.text}"`);
      toast.success("Quote disalin ke clipboard.");
    } catch {
      toast.error("Gagal menyalin quote.");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">
              Daftar Quote
            </h1>
            <p className="text-xs text-white/50">
              {quotes.length} quote tersimpan ({QUOTE_RETENTION_DAYS} hari terakhir)
            </p>
          </div>
        </div>
      </header>

      <section className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari teks quote..."
            className={cn(inputClass, "pl-9")}
          />
        </div>
        <select
          value={categoryKey}
          onChange={(event) => setCategoryKey(event.target.value)}
          className={cn(inputClass, "sm:w-52")}
        >
          <option value="ALL">Semua kategori</option>
          {categories.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </section>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center">
          <QuoteIcon className="h-10 w-10 text-indigo-300" />
          <p className="text-lg font-semibold">Belum ada quote</p>
          <p className="max-w-sm text-sm text-white/60">
            {quotes.length === 0
              ? "Quote akan muncul di sini setelah proses generate harian berjalan."
              : "Tidak ada quote yang cocok dengan filter pencarian."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((quote) => (
            <li
              key={quote.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-start sm:gap-4"
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white",
                  gradientClass(quote.categoryGradient),
                )}
              >
                <CategoryIcon name={quote.categoryIcon} className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-line text-sm leading-relaxed text-white/90">
                  &ldquo;{quote.text}&rdquo;
                </p>
                <p className="mt-2 text-[11px] text-white/50">
                  {quote.categoryLabel} · {formatDate(quote.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleCopy(quote)}
                className="flex shrink-0 items-center justify-center gap-1.5 self-start rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10"
              >
                <Clipboard className="h-3.5 w-3.5" /> Salin
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

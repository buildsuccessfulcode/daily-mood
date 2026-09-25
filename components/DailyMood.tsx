"use client";

import { useRef, useState } from "react";
import { Clipboard, Download, Loader2, Quote as QuoteIcon } from "lucide-react";
import { useDownloadQuote } from "@/hooks/useDownloadQuote";
import { useToast } from "@/components/ui/Toast";
import { formatQuoteDate } from "@/lib/quotes";
import type { QuoteCardData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./CategoryIcon";
import { QuoteCard } from "./QuoteCard";

function fileDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DailyMood({
  cards,
  watermark,
}: {
  cards: QuoteCardData[];
  watermark: string;
}) {
  const toast = useToast();
  const [activeId, setActiveId] = useState(cards[0]?.category.id ?? "");
  const cardRef = useRef<HTMLDivElement>(null);
  const { pending, download } = useDownloadQuote();

  const active = cards.find((card) => card.category.id === activeId) ?? cards[0];

  if (!active) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center">
        <QuoteIcon className="h-10 w-10 text-indigo-300" />
        <p className="text-lg font-semibold">Belum ada kategori aktif</p>
        <p className="max-w-sm text-sm text-white/60">
          Tambahkan atau aktifkan kategori dari halaman admin untuk mulai
          menampilkan quote harian.
        </p>
      </div>
    );
  }

  const dateLabel = formatQuoteDate();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        `"${active.quote.text}"\n\n${active.category.label} - ${watermark}`,
      );
      toast.success("Quote disalin ke clipboard.");
    } catch {
      toast.error("Gagal menyalin quote.");
    }
  };

  const handleDownload = async () => {
    const ok = await download(
      cardRef.current,
      `daily-mood-${active.category.key.toLowerCase()}-${fileDate()}.png`,
    );
    if (ok) {
      toast.success("Gambar berhasil diunduh.");
    } else {
      toast.error("Gagal mengunduh gambar.");
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex w-full max-w-md items-center gap-2 overflow-x-auto pb-1">
        {cards.map((card) => {
          const isActive = card.category.id === active.category.id;
          return (
            <button
              key={card.category.id}
              type="button"
              onClick={() => setActiveId(card.category.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition",
                isActive
                  ? "border-white/30 bg-white text-slate-900"
                  : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10",
              )}
            >
              <CategoryIcon name={card.category.iconName} className="h-3.5 w-3.5" />
              {card.category.label}
            </button>
          );
        })}
      </div>

      <div className="flex w-full justify-center">
        <div className="flex h-[408px] items-start justify-center overflow-visible min-[400px]:h-[480px]">
          <div className="origin-top scale-[0.85] min-[400px]:scale-100">
            <QuoteCard
              ref={cardRef}
              data={active}
              dateLabel={dateLabel}
              watermark={watermark}
            />
          </div>
        </div>
      </div>

      <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={pending}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-900/40 transition hover:brightness-110 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {pending ? "Menyiapkan..." : "Download PNG"}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
        >
          <Clipboard className="h-4 w-4" />
          Salin teks
        </button>
      </div>
    </div>
  );
}

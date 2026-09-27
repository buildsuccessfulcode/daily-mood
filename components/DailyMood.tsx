"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  CalendarDays,
  Clipboard,
  Download,
  Loader2,
  Quote as QuoteIcon,
} from "lucide-react";
import { useDownloadQuote } from "@/hooks/useDownloadQuote";
import { useToast } from "@/components/ui/Toast";
import { formatQuoteDate } from "@/lib/quotes";
import type { DayCard } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./CategoryIcon";
import { QuoteCard } from "./QuoteCard";

function ScrollRow({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleWheel = (event: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      const delta = event.deltaY !== 0 ? event.deltaY : event.deltaX;
      if (delta === 0) return;
      const atStart = el.scrollLeft <= 0 && delta < 0;
      const atEnd =
        el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 && delta > 0;
      if (atStart || atEnd) return;
      event.preventDefault();
      el.scrollLeft += delta;
    };

    let dragging = false;
    let moved = false;
    let startX = 0;
    let startLeft = 0;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      if (el.scrollWidth <= el.clientWidth) return;
      dragging = true;
      moved = false;
      startX = event.clientX;
      startLeft = el.scrollLeft;
      el.style.cursor = "grabbing";
      el.style.userSelect = "none";
      el.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      el.scrollLeft = startLeft - dx;
    };

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      el.style.cursor = "";
      el.style.userSelect = "";
    };

    const handleClickCapture = (event: MouseEvent) => {
      if (!moved) return;
      event.preventDefault();
      event.stopPropagation();
      moved = false;
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    el.addEventListener("pointerdown", handlePointerDown);
    el.addEventListener("pointermove", handlePointerMove);
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
    el.addEventListener("click", handleClickCapture, true);
    return () => {
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("pointerdown", handlePointerDown);
      el.removeEventListener("pointermove", handlePointerMove);
      el.removeEventListener("pointerup", endDrag);
      el.removeEventListener("pointercancel", endDrag);
      el.removeEventListener("click", handleClickCapture, true);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="no-scrollbar flex w-full max-w-md snap-x items-center gap-2 overflow-x-auto pb-1 sm:max-w-xl"
    >
      {children}
    </div>
  );
}

export function DailyMood({
  days,
  watermark,
}: {
  days: DayCard[];
  watermark: string;
}) {
  const toast = useToast();
  const hasAnyCard = days.some((day) => day.cards.length > 0);
  const [activeDateKey, setActiveDateKey] = useState(
    () => days.find((day) => day.hasQuotes)?.dateKey ?? days[0]?.dateKey ?? "",
  );
  const [activeCategoryId, setActiveCategoryId] = useState(
    () => days.find((day) => day.hasQuotes)?.cards[0]?.category.id ?? "",
  );
  const cardRef = useRef<HTMLDivElement>(null);
  const { pending, download } = useDownloadQuote();

  const activeDay =
    days.find((day) => day.dateKey === activeDateKey) ?? days[0];
  const active =
    activeDay?.cards.find((card) => card.category.id === activeCategoryId) ??
    activeDay?.cards[0];

  if (!hasAnyCard || !activeDay || !active) {
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

  const dateLabel = formatQuoteDate(
    new Date(`${activeDay.dateKey}T00:00:00+07:00`),
  );

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
      `daily-mood-${active.category.key.toLowerCase()}-${activeDay.dateKey}.png`,
    );
    if (ok) {
      toast.success("Gambar berhasil diunduh.");
    } else {
      toast.error("Gagal mengunduh gambar.");
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-5 sm:gap-6">
      <ScrollRow>
        {days.map((day) => {
          const isActive = day.dateKey === activeDay.dateKey;
          return (
            <button
              key={day.dateKey}
              type="button"
              disabled={!day.hasQuotes}
              onClick={() => setActiveDateKey(day.dateKey)}
              className={cn(
                "flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                isActive
                  ? "border-indigo-400/40 bg-indigo-500/20 text-white"
                  : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10",
                !day.hasQuotes &&
                  "cursor-not-allowed opacity-40 hover:bg-white/5",
              )}
            >
              <CalendarDays className="h-3 w-3" />
              {day.label}
            </button>
          );
        })}
      </ScrollRow>

      <ScrollRow>
        {activeDay.cards.map((card) => {
          const isActive = card.category.id === active.category.id;
          return (
            <button
              key={card.category.id}
              type="button"
              onClick={() => setActiveCategoryId(card.category.id)}
              className={cn(
                "flex shrink-0 snap-start items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition",
                isActive
                  ? "border-white/30 bg-white text-slate-900"
                  : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10",
              )}
            >
              <CategoryIcon
                name={card.category.iconName}
                className="h-3.5 w-3.5"
              />
              {card.category.label}
            </button>
          );
        })}
      </ScrollRow>

      <div className="flex w-full justify-center">
        <div className="relative h-[326px] w-[245px] min-[320px]:h-[375px] min-[320px]:w-[281px] min-[360px]:h-[432px] min-[360px]:w-[324px] min-[400px]:h-[480px] min-[400px]:w-[360px] min-[1024px]:h-[528px] min-[1024px]:w-[396px]">
          <div className="origin-top-left scale-[0.68] min-[320px]:scale-[0.78] min-[360px]:scale-[0.9] min-[400px]:scale-100 min-[1024px]:scale-110">
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

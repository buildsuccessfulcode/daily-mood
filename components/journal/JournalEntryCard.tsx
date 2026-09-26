import { Lock } from "lucide-react";
import { MOOD_OPTIONS } from "@/lib/constants";
import { formatQuoteDate } from "@/lib/quotes";
import { AIResponseCard } from "./AIResponseCard";
import { ResetCountdown } from "./ResetCountdown";
import type { JournalEntry } from "@/lib/types";

export function JournalEntryCard({ entry }: { entry: JournalEntry }) {
  const mood = MOOD_OPTIONS.find((option) => option.value === entry.mood);
  const dateLabel = formatQuoteDate(new Date(`${entry.journalDate}T00:00:00+07:00`));

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-xs font-semibold text-white/60">
            <span className="text-xl" aria-hidden="true">
              {mood?.emoji}
            </span>
            {mood?.label ?? entry.mood}
          </span>
          <span className="text-[11px] text-white/40">{dateLabel}</span>
        </div>
        <p className="whitespace-pre-line text-sm leading-relaxed text-white/85">
          {entry.entryText}
        </p>
      </div>

      <AIResponseCard aiResponse={entry.aiResponse} />

      <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/50">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          Refleksi hari ini selesai. Kamu bisa menulis journal lagi dalam{" "}
          <ResetCountdown /> (reset 00:00 WIB).
        </p>
      </div>
    </div>
  );
}

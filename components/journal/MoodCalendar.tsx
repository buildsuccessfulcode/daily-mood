import { MOOD_OPTIONS, moodOption } from "@/lib/constants";
import { moodSummary, recentDateKeys } from "@/lib/journal";
import { dateKey, dayLabel } from "@/lib/quotes";
import { cn } from "@/lib/utils";
import type { MoodHistoryItem, MoodType } from "@/lib/types";

type MoodCalendarProps = {
  history: MoodHistoryItem[];
  days?: number;
};

const MOOD_TINT: Record<MoodType, string> = {
  SAD: "border-sky-400/25 bg-sky-500/15",
  TIRED: "border-violet-400/25 bg-violet-500/15",
  NEUTRAL: "border-white/10 bg-white/10",
  HAPPY: "border-amber-400/25 bg-amber-500/15",
  EXCITED: "border-emerald-400/25 bg-emerald-500/15",
};

export function MoodCalendar({ history, days = 30 }: MoodCalendarProps) {
  const today = dateKey();
  const keys = recentDateKeys(days, today);
  const summary = moodSummary(history, days, today);
  const moods = new Map(history.map((item) => [item.dateKey, item.mood]));
  const topMood = summary.topMood ? moodOption(summary.topMood) : null;

  const stats = [
    { label: "Tercatat", value: `${summary.recordedDays}/${summary.totalDays} hari` },
    { label: "Streak", value: `${summary.currentStreak} hari` },
    {
      label: "Mood dominan",
      value: topMood ? `${topMood.emoji} ${topMood.label}` : "-",
    },
  ];

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <h2 className="text-sm font-bold text-white/80">
        Mood {days} Hari Terakhir
      </h2>

      <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
        {MOOD_OPTIONS.map((option) => (
          <li
            key={option.value}
            className="flex items-center gap-1 text-[10px] text-white/50"
          >
            <span aria-hidden="true">{option.emoji}</span>
            {option.label}
          </li>
        ))}
      </ul>

      <div className="mt-4 grid grid-cols-10 gap-1.5 sm:gap-2">
        {keys.map((key) => {
          const mood = moods.get(key);
          const emoji = mood ? moodOption(mood)?.emoji : null;
          const isToday = key === today;
          const dayNumber = Number(key.slice(8, 10));
          const moodLabel = mood
            ? (moodOption(mood)?.label ?? mood)
            : "Belum ada journal";
          return (
            <div
              key={key}
              title={`${dayLabel(key, today)} - ${moodLabel}`}
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-lg border text-xs sm:text-base",
                mood ? MOOD_TINT[mood] : "border-white/5 bg-black/20",
                isToday && "ring-2 ring-indigo-400/70",
              )}
            >
              <span className="absolute right-1 top-0.5 text-[8px] leading-none text-white/40 sm:text-[9px]">
                {dayNumber}
              </span>
              {emoji ? <span aria-hidden="true">{emoji}</span> : null}
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2"
          >
            <p className="text-[10px] uppercase tracking-wide text-white/40">
              {stat.label}
            </p>
            <p className="mt-0.5 truncate text-xs font-bold text-white/80">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-white/40">
        Kotak berisi emoji = mood hari itu. Angka = tanggal. Cincin = hari ini.
      </p>
    </section>
  );
}

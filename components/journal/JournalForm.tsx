"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import {
  JOURNAL_MAX_WORDS,
  JOURNAL_MIN_WORDS,
  MOOD_OPTIONS,
} from "@/lib/constants";
import { countWords, validateEntry } from "@/lib/journal";
import { submitJournalAction } from "@/app/journal/actions";
import type { MoodType } from "@/lib/types";

export function JournalForm() {
  const router = useRouter();
  const toast = useToast();
  const [mood, setMood] = useState<MoodType | null>(null);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const words = countWords(text);
  const invalid = !mood || words < JOURNAL_MIN_WORDS || words > JOURNAL_MAX_WORDS;
  const wordColor =
    words > JOURNAL_MAX_WORDS
      ? "text-red-300"
      : words >= JOURNAL_MIN_WORDS
        ? "text-emerald-300"
        : "text-white/40";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const clientError = validateEntry(mood ?? "", text);
    if (clientError) {
      setError(clientError);
      return;
    }
    setError("");
    setPending(true);
    const result = await submitJournalAction(mood ?? "", text);
    if (result.ok) {
      toast.success(result.message ?? "Journal tersimpan.");
      router.refresh();
    } else {
      setError(result.error);
      toast.error(result.error);
      setPending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
    >
      <div>
        <h2 className="text-base font-extrabold">
          Gimana perasaanmu hari ini?
        </h2>
        <p className="mt-1 text-xs text-white/50">
          Pilih satu mood, lalu ceritakan harimu. Satu journal per hari.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {MOOD_OPTIONS.map((option) => {
          const active = mood === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setMood(option.value)}
              aria-pressed={active}
              className={[
                "flex flex-col items-center gap-1 rounded-2xl border px-1 py-3 transition",
                active
                  ? "border-indigo-400/70 bg-indigo-500/20"
                  : "border-white/10 bg-black/20 hover:bg-white/5",
              ].join(" ")}
            >
              <span className="text-xl sm:text-2xl" aria-hidden="true">
                {option.emoji}
              </span>
              <span className="text-[10px] font-semibold leading-tight text-white/70">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      <label className="block">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={8}
          placeholder="Ceritain kejadian hari ini, apa yang kamu rasain, dan apa yang bikin kamu kepikiran..."
          className="w-full resize-y rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm leading-relaxed outline-none focus:border-indigo-400"
        />
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <span className={wordColor}>
            {words} kata (min {JOURNAL_MIN_WORDS}, maks {JOURNAL_MAX_WORDS})
          </span>
          {text.length > 0 ? (
            <button
              type="button"
              onClick={() => setText("")}
              className="text-white/40 transition hover:text-white/70"
            >
              Bersihkan
            </button>
          ) : null}
        </div>
      </label>

      {error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || invalid}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Menyusun balasan...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" /> Kirim & Dengarkan
          </>
        )}
      </button>

      <p className="text-center text-[11px] leading-relaxed text-white/40">
        Daily Companion adalah AI teman refleksi harian dan bukan pengganti
        konseling psikologis profesional.
      </p>
    </form>
  );
}

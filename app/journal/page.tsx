import { SiteHeader } from "@/components/SiteHeader";
import { JournalEntryCard } from "@/components/journal/JournalEntryCard";
import { JournalForm } from "@/components/journal/JournalForm";
import { MoodCalendar } from "@/components/journal/MoodCalendar";
import { requireUserPage } from "@/lib/auth-user";
import { getJournalHistory, getTodayJournal } from "@/lib/journal-data";
import { getProfile, greetingName } from "@/lib/profile-data";
import { formatQuoteDate } from "@/lib/quotes";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  await requireUserPage("/journal");
  const profile = await getProfile();

  const [entry, history] = await Promise.all([
    getTodayJournal(),
    getJournalHistory(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 pt-8 pb-8">
      <SiteHeader />

      <div className="text-center">
        <h1 className="text-xl font-extrabold">
          Hai, {greetingName(profile) ?? "kamu"}
        </h1>
        <p className="text-xs text-white/50">
          {formatQuoteDate()} &bull; Refleksi harian
        </p>
      </div>

      {entry ? <JournalEntryCard entry={entry} /> : <JournalForm />}

      <MoodCalendar history={history} />

      <footer className="pb-4 text-center text-[11px] text-white/40">
        Curhatanmu privat dan hanya bisa dilihat olehmu.
      </footer>
    </div>
  );
}

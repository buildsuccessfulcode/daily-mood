import Link from "next/link";
import { Sparkles } from "lucide-react";
import { DailyMood } from "@/components/DailyMood";
import { SiteHeader } from "@/components/SiteHeader";
import { isSupabaseConfigured } from "@/lib/config";
import { getDailyMood, getWatermark } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const configured = isSupabaseConfigured();
  const [days, watermark] = await Promise.all([
    configured ? getDailyMood() : Promise.resolve([]),
    getWatermark(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pt-8 pb-8 sm:pt-12 sm:pb-12">
      <SiteHeader />

      <main className="flex flex-1 flex-col items-center justify-center gap-8 py-10">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-indigo-200">
            <Sparkles className="h-3 w-3" /> Update otomatis setiap hari
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Mood hari ini, nih.
          </h1>
          <p className="max-w-md text-sm text-white/60">
            Pilih kategori, unduh kartunya, lalu bagikan ke WhatsApp Status,
            Instagram Story, atau TikTok.
          </p>
        </div>

        {configured ? (
          <DailyMood days={days} watermark={watermark} />
        ) : (
          <div className="w-full max-w-md rounded-3xl border border-amber-400/30 bg-amber-400/10 p-6 text-sm text-amber-100">
            <p className="mb-2 font-bold">Supabase belum dikonfigurasi</p>
            <p className="text-amber-100/80">
              Isi <code className="rounded bg-black/30 px-1">.env.local</code>{" "}
              lalu restart dev server. Lihat{" "}
              <code className="rounded bg-black/30 px-1">docs/SETUP.md</code>.
            </p>
          </div>
        )}
      </main>

      <footer className="flex flex-col items-center gap-2 pt-6 text-center text-xs text-white/40 sm:flex-row sm:flex-wrap sm:justify-center">
        <span>{watermark}</span>
        <span className="hidden sm:inline">&bull;</span>
        <span>Konten dibuat oleh AI, dipilih dengan rasa.</span>
        <span className="hidden sm:inline">&bull;</span>
        <Link
          href="/admin"
          className="rounded-full border border-white/10 px-3 py-1 transition hover:bg-white/5 hover:text-white/70"
        >
          Admin
        </Link>
      </footer>
    </div>
  );
}

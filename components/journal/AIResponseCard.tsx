import { Sparkles } from "lucide-react";

type AIResponseCardProps = {
  aiResponse: string;
};

export function AIResponseCard({ aiResponse }: AIResponseCardProps) {
  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
          <Sparkles className="h-4 w-4" /> Balasan Teman AI
        </span>
      </div>

      <p className="whitespace-pre-line text-sm leading-relaxed text-white/85">
        {aiResponse}
      </p>
    </div>
  );
}

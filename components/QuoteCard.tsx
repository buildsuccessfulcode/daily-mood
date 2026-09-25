"use client";

import type { Ref } from "react";
import { BRAND_NAME, gradientClass } from "@/lib/constants";
import type { QuoteCardData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./CategoryIcon";
import { Logo } from "./Logo";

type QuoteCardProps = {
  data: QuoteCardData;
  dateLabel: string;
  watermark: string;
  ref?: Ref<HTMLDivElement>;
};

export function QuoteCard({ data, dateLabel, watermark, ref }: QuoteCardProps) {
  const { category, quote } = data;

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-[480px] w-[360px] shrink-0 flex-col justify-between overflow-hidden rounded-[28px] p-7 text-white shadow-2xl shadow-black/50",
        gradientClass(category.themeGradient),
      )}
    >
      <div className="pointer-events-none absolute inset-0 z-0 flex select-none items-center justify-center opacity-[0.06]">
        <span className="-rotate-[20deg] text-5xl font-extrabold tracking-tight">
          {watermark}
        </span>
      </div>
      <div className="pointer-events-none absolute -right-16 -top-16 z-0 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">
          <CategoryIcon name={category.iconName} className="h-4 w-4" />
          <span>{category.label}</span>
        </div>
        <span className="text-xs font-medium text-white/60">{dateLabel}</span>
      </div>

      <div className="relative z-10 my-auto">
        <p className="text-[19px] font-semibold leading-relaxed tracking-wide drop-shadow-sm">
          &ldquo;{quote.text}&rdquo;
        </p>
      </div>

      <div className="relative z-10 flex items-center justify-between border-t border-white/15 pt-4 text-xs text-white/80">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-white p-0.5">
            <Logo size={20} className="rounded-full" />
          </span>
          <span className="font-bold tracking-wider">{BRAND_NAME}</span>
        </div>
        <span className="font-mono text-white/50">{watermark}</span>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { nextResetWIB } from "@/lib/journal";

function formatDuration(ms: number): string {
  if (ms <= 0) return "sebentar lagi";
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${hours} jam ${minutes} menit ${seconds} detik`;
}

export function ResetCountdown() {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const tick = () =>
      setLabel(formatDuration(nextResetWIB().getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return <span className="font-semibold text-white/80">{label || "..."}</span>;
}

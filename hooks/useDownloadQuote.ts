"use client";

import { useCallback, useState } from "react";
import { toPng } from "html-to-image";

export function useDownloadQuote() {
  const [pending, setPending] = useState(false);

  const download = useCallback(
    async (node: HTMLElement | null, filename: string): Promise<boolean> => {
      if (!node || pending) return false;
      setPending(true);
      try {
        const dataUrl = await toPng(node, {
          pixelRatio: 3,
          cacheBust: true,
          backgroundColor: "#0b0b16",
        });
        const link = document.createElement("a");
        link.download = filename;
        link.href = dataUrl;
        link.click();
        return true;
      } catch {
        return false;
      } finally {
        setPending(false);
      }
    },
    [pending],
  );

  return { pending, download };
}

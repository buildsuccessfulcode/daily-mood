"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";

type ToastItem = {
  id: number;
  kind: ToastKind;
  message: string;
};

type ToastContextValue = {
  show: (message: string, kind?: ToastKind) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

const TOAST_STYLES: Record<ToastKind, string> = {
  success: "border-emerald-400/30 bg-emerald-500/15 text-emerald-50",
  error: "border-red-400/30 bg-red-500/15 text-red-50",
  info: "border-indigo-400/30 bg-indigo-500/15 text-indigo-50",
};

let nextToastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (message: string, kind: ToastKind = "info") => {
      nextToastId += 1;
      const id = nextToastId;
      setToasts((prev) => [...prev, { id, kind, message }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (message) => show(message, "success"),
      error: (message) => show(message, "error"),
      info: (message) => show(message, "info"),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 px-4 pt-4 sm:items-end"
      >
        {toasts.map((toast) => {
          const Icon = TOAST_ICONS[toast.kind];
          return (
            <div
              key={toast.id}
              role="status"
              className={cn(
                "toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-lg shadow-black/30 backdrop-blur",
                TOAST_STYLES[toast.kind],
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="min-w-0 flex-1 break-words leading-snug">
                {toast.message}
              </p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Tutup notifikasi"
                className="shrink-0 text-white/60 transition hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast harus dipakai di dalam ToastProvider");
  }
  return context;
}

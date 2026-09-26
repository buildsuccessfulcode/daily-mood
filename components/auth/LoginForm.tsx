"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useToast } from "@/components/ui/Toast";
import { signInWithGoogleAction } from "@/app/auth/actions";

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8H1.3v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8Z"
      />
    </svg>
  );
}

type LoginFormProps = {
  next: string;
  initialError?: string;
};

export function LoginForm({ next, initialError }: LoginFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(initialError ?? "");

  const handleGoogle = async () => {
    setPending(true);
    setError("");
    const result = await signInWithGoogleAction(next);
    if (result.ok && result.data) {
      const data = result.data as { url: string };
      window.location.href = data.url;
      return;
    }
    const message = result.ok ? "Gagal memulai login Google." : result.error;
    setError(message);
    toast.error(message);
    setPending(false);
  };

  return (
    <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <Logo size={48} />
        <div>
          <h1 className="text-lg font-extrabold">Masuk ke Daily Mood</h1>
          <p className="text-xs text-white/50">
            Lanjutkan journal & refleksi harianmu
          </p>
        </div>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleGoogle}
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-white/90 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
        Masuk dengan Google
      </button>

      <p className="mt-5 text-center text-[11px] leading-relaxed text-white/40">
        Akun dibuat otomatis saat pertama kali masuk. Kamu bisa mengganti nama
        panggilan di halaman profil.
      </p>

      <button
        type="button"
        onClick={() => router.back()}
        className="mt-4 w-full text-center text-xs text-white/40 transition hover:text-white/70"
      >
        Kembali
      </button>
    </div>
  );
}

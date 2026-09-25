"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useToast } from "@/components/ui/Toast";
import { loginAction } from "@/app/actions";

export function LoginForm() {
  const router = useRouter();
  const toast = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    const result = await loginAction(username, password);
    if (result.ok) {
      toast.success(result.message ?? "Berhasil masuk.");
      router.replace("/admin");
      router.refresh();
    } else {
      toast.error(result.error);
      setPending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur"
    >
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <Logo size={48} />
        <div>
          <h1 className="text-lg font-extrabold">Admin Daily Mood</h1>
          <p className="text-xs text-white/50">Masuk untuk mengelola konten</p>
        </div>
      </div>

      <label className="mb-3 block">
        <span className="mb-1 block text-xs font-semibold text-white/70">
          Username
        </span>
        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
          required
        />
      </label>

      <label className="mb-4 block">
        <span className="mb-1 block text-xs font-semibold text-white/70">
          Password
        </span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
          required
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Masuk
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { isValidNickname } from "@/lib/constants";
import { updateProfileAction } from "@/app/profile/actions";

type ProfileFormProps = {
  initialNickname: string;
  email: string;
};

export function ProfileForm({ initialNickname, email }: ProfileFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [nickname, setNickname] = useState(initialNickname);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const changed = nickname.trim() !== initialNickname;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setPending(true);
    const result = await updateProfileAction(nickname);
    if (result.ok) {
      toast.success(result.message ?? "Profil diperbarui.");
      router.refresh();
      setPending(false);
    } else {
      setError(result.error);
      toast.error(result.error);
      setPending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
    >
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-white/70">
          Email
        </span>
        <input
          type="email"
          value={email}
          readOnly
          className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white/50 outline-none"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-white/70">
          Nama panggilan
        </span>
        <input
          type="text"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          maxLength={24}
          className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
          required
        />
        <span className="mt-1 block text-[11px] text-white/40">
          2-24 karakter, harus unik.
        </span>
      </label>

      {error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || !changed || !isValidNickname(nickname)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Simpan
      </button>
    </form>
  );
}

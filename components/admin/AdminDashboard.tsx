"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Droplet,
  KeyRound,
  List,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash,
  Trash2,
} from "lucide-react";
import {
  changePasswordAction,
  cleanupNowAction,
  deleteCategoryAction,
  deleteGeminiKeyAction,
  generateNowAction,
  listGeminiModelsAction,
  logoutAction,
  saveCategoryAction,
  saveGeminiKeyAction,
  saveGeminiModelAction,
  saveWatermarkAction,
  seedDefaultsAction,
} from "@/app/actions";
import { CategoryIcon } from "@/components/CategoryIcon";
import { useToast } from "@/components/ui/Toast";
import {
  GEMINI_MODELS,
  GRADIENT_PRESETS,
  ICON_OPTIONS,
  QUOTE_RETENTION_DAYS,
  geminiModelLabel,
  gradientClass,
} from "@/lib/constants";
import type {
  ActionResult,
  CategoryInput,
  GeminiModelOption,
} from "@/lib/types";
import type { AdminOverview } from "@/lib/data";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-indigo-400";

function emptyCategory(sortOrder: number): CategoryInput {
  return {
    key: "",
    label: "",
    iconName: ICON_OPTIONS[0],
    themeGradient: GRADIENT_PRESETS[0].value,
    prompt: "",
    sortOrder,
    isActive: true,
  };
}

export function AdminDashboard({ overview }: { overview: AdminOverview }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(overview.geminiModel);
  const [models, setModels] = useState<GeminiModelOption[]>(GEMINI_MODELS);
  const [loadingModels, setLoadingModels] = useState(false);
  const modelsLoadedRef = useRef(false);
  const [watermark, setWatermark] = useState(overview.watermark);
  const [categoryForm, setCategoryForm] = useState<CategoryInput>(
    emptyCategory(overview.categories.length + 1),
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const run = async (
    key: string,
    fn: () => Promise<ActionResult>,
  ): Promise<ActionResult> => {
    setBusy(key);
    try {
      const result = await fn();
      if (result.ok) {
        toast.success(result.message ?? "Berhasil.");
      } else {
        toast.error(result.error);
      }
      router.refresh();
      return result;
    } finally {
      setBusy(null);
    }
  };

  const loadModels = useCallback(
    async (announce = false) => {
      setLoadingModels(true);
      try {
        const result = await listGeminiModelsAction();
        const list = result.ok
          ? ((result.data as GeminiModelOption[] | undefined) ?? [])
          : [];
        if (result.ok && list.length > 0) {
          setModels(list);
          modelsLoadedRef.current = true;
          if (announce) {
            toast.success(`Daftar model diperbarui (${list.length} model).`);
          }
        } else {
          modelsLoadedRef.current = false;
          if (announce) {
            toast.error(result.ok ? "Daftar model kosong." : result.error);
          }
        }
      } finally {
        setLoadingModels(false);
      }
    },
    [toast],
  );

  const handleModelFocus = () => {
    if (modelsLoadedRef.current || !overview.geminiKeyFilled) return;
    modelsLoadedRef.current = true;
    void loadModels(false);
  };

  const modelOptions = useMemo(() => {
    if (models.some((option) => option.value === model)) return models;
    return [{ value: model, label: geminiModelLabel(model) }, ...models];
  }, [models, model]);

  const resetCategoryForm = () => {
    setCategoryForm(emptyCategory(overview.categories.length + 1));
  };

  const handleSaveCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await run("save-category", () =>
      saveCategoryAction(categoryForm),
    );
    if (result.ok) resetCategoryForm();
  };

  const handleLogout = async () => {
    await logoutAction();
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">
            Dashboard Admin
          </h1>
          <p className="text-xs text-white/50">
            Kelola AI key, kategori, dan konten harian
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/quotes"
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10"
          >
            <List className="h-3.5 w-3.5" /> Daftar Quote
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10"
          >
            <LogOut className="h-3.5 w-3.5" /> Keluar
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="mb-3 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-indigo-300" />
            <h2 className="text-sm font-bold">Gemini AI Key</h2>
          </div>
          <p className="mb-3 text-xs text-white/60">
            Status:{" "}
            {overview.geminiKeyFilled ? (
              <span className="break-all font-mono text-emerald-200">
                {overview.geminiKeyMasked}
              </span>
            ) : (
              <span className="text-amber-200">belum diatur</span>
            )}
          </p>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const result = await run("save-key", () =>
                saveGeminiKeyAction(apiKey),
              );
              if (result.ok) {
                setApiKey("");
                void loadModels(true);
              }
            }}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <input
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="Masukkan API key Gemini baru"
              className={inputClass}
            />
            <button
              type="submit"
              disabled={busy === "save-key" || apiKey.trim().length === 0}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-400 disabled:opacity-50"
            >
              {busy === "save-key" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Simpan
            </button>
          </form>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              await run("save-model", () => saveGeminiModelAction(model));
            }}
            className="mt-4 border-t border-white/10 pt-4"
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="block text-xs font-semibold text-white/60">
                Model Gemini
              </label>
              <button
                type="button"
                onClick={() => void loadModels(true)}
                disabled={loadingModels || !overview.geminiKeyFilled}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-300 transition hover:text-indigo-200 disabled:opacity-50"
              >
                <RefreshCw
                  className={cn("h-3 w-3", loadingModels && "animate-spin")}
                />
                Muat dari API
              </button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={model}
                onChange={(event) => setModel(event.target.value)}
                onFocus={handleModelFocus}
                className={inputClass}
              >
                {modelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={busy === "save-model" || model === overview.geminiModel}
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-400 disabled:opacity-50"
              >
                {busy === "save-model" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Simpan
              </button>
            </div>
          </form>
          {overview.geminiKeyFilled ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Hapus AI key tersimpan?")) {
                  void run("delete-key", deleteGeminiKeyAction);
                }
              }}
              className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-red-300 hover:text-red-200"
            >
              <Trash2 className="h-3.5 w-3.5" /> Hapus AI key
            </button>
          ) : null}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-300" />
            <h2 className="text-sm font-bold">Aksi Cepat</h2>
          </div>
          <p className="mb-3 text-xs text-white/60">
            {overview.totalQuotes} quote aktif ({QUOTE_RETENTION_DAYS} hari terakhir).
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void run("generate", generateNowAction)}
              disabled={busy === "generate"}
              className="flex items-center gap-2 rounded-xl bg-purple-500 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-purple-400 disabled:opacity-50"
            >
              {busy === "generate" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Generate sekarang
            </button>
            <button
              type="button"
              onClick={() => void run("cleanup", cleanupNowAction)}
              disabled={busy === "cleanup"}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-white/80 transition hover:bg-white/10 disabled:opacity-50"
            >
              {busy === "cleanup" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash className="h-3.5 w-3.5" />
              )}
              Bersihkan quote lama
            </button>
            <button
              type="button"
              onClick={() => void run("seed", seedDefaultsAction)}
              disabled={busy === "seed"}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-white/80 transition hover:bg-white/10 disabled:opacity-50"
            >
              {busy === "seed" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Seed kategori default
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Droplet className="h-4 w-4 text-cyan-300" />
          <h2 className="text-sm font-bold">Watermark Aplikasi</h2>
        </div>
        <p className="mb-3 text-xs text-white/60">
          Teks ini tampil pada kartu quote, hasil salinan, dan footer aplikasi.
        </p>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            await run("save-watermark", () => saveWatermarkAction(watermark));
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <input
            value={watermark}
            onChange={(event) => setWatermark(event.target.value)}
            placeholder="@dailymood"
            maxLength={60}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={busy === "save-watermark" || watermark.trim().length === 0}
            className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-cyan-400 disabled:opacity-50"
          >
            {busy === "save-watermark" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Droplet className="h-4 w-4" />
            )}
            Simpan
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-4 text-sm font-bold">Kategori Quote</h2>
        <div className="mb-6 flex flex-col gap-2">
          {overview.categories.length === 0 ? (
            <p className="text-xs text-white/50">
              Belum ada kategori. Tambahkan atau seed kategori default.
            </p>
          ) : (
            overview.categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5"
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white",
                    gradientClass(category.themeGradient),
                  )}
                >
                  <CategoryIcon name={category.iconName} className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {category.label}
                  </p>
                  <p className="text-[11px] text-white/50">
                    {category.key} ·{" "}
                    {overview.quoteCounts[category.id] ?? 0} quote ·{" "}
                    {category.isActive ? "aktif" : "nonaktif"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCategoryForm({
                      id: category.id,
                      key: category.key,
                      label: category.label,
                      iconName: category.iconName,
                      themeGradient: category.themeGradient,
                      prompt: category.prompt,
                      sortOrder: category.sortOrder,
                      isActive: category.isActive,
                    })
                  }
                  className="rounded-lg border border-white/15 p-1.5 text-white/70 transition hover:bg-white/10"
                  aria-label="Edit kategori"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Hapus kategori "${category.label}" beserta quote-nya?`,
                      )
                    ) {
                      void run(`delete-${category.id}`, () =>
                        deleteCategoryAction(category.id),
                      );
                    }
                  }}
                  className="rounded-lg border border-red-400/30 p-1.5 text-red-300 transition hover:bg-red-400/10"
                  aria-label="Hapus kategori"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSaveCategory} className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-white/60">
              Label
            </span>
            <input
              value={categoryForm.label}
              onChange={(event) =>
                setCategoryForm({ ...categoryForm, label: event.target.value })
              }
              className={inputClass}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-white/60">
              Key (A-Z, 0-9, _)
            </span>
            <input
              value={categoryForm.key}
              onChange={(event) =>
                setCategoryForm({
                  ...categoryForm,
                  key: event.target.value.toUpperCase(),
                })
              }
              className={inputClass}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-white/60">
              Ikon
            </span>
            <select
              value={categoryForm.iconName}
              onChange={(event) =>
                setCategoryForm({
                  ...categoryForm,
                  iconName: event.target.value,
                })
              }
              className={inputClass}
            >
              {ICON_OPTIONS.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-white/60">
              Gradient
            </span>
            <select
              value={categoryForm.themeGradient}
              onChange={(event) =>
                setCategoryForm({
                  ...categoryForm,
                  themeGradient: event.target.value,
                })
              }
              className={inputClass}
            >
              {GRADIENT_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-white/60">
              Urutan
            </span>
            <input
              type="number"
              value={categoryForm.sortOrder}
              onChange={(event) =>
                setCategoryForm({
                  ...categoryForm,
                  sortOrder: Number(event.target.value),
                })
              }
              className={inputClass}
            />
          </label>
          <label className="flex items-center gap-2 self-end pb-2">
            <input
              type="checkbox"
              checked={categoryForm.isActive}
              onChange={(event) =>
                setCategoryForm({
                  ...categoryForm,
                  isActive: event.target.checked,
                })
              }
              className="h-4 w-4 accent-indigo-500"
            />
            <span className="text-xs font-semibold text-white/70">
              Aktif (ikut generate harian)
            </span>
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-white/60">
              Prompt Gemini
            </span>
            <textarea
              value={categoryForm.prompt}
              onChange={(event) =>
                setCategoryForm({ ...categoryForm, prompt: event.target.value })
              }
              rows={3}
              className={inputClass}
              required
            />
          </label>
          <div className="flex gap-2 md:col-span-2">
            <button
              type="submit"
              disabled={busy === "save-category"}
              className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-400 disabled:opacity-50"
            >
              {busy === "save-category" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {categoryForm.id ? "Perbarui kategori" : "Tambah kategori"}
            </button>
            {categoryForm.id ? (
              <button
                type="button"
                onClick={resetCategoryForm}
                className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/10"
              >
                Batal
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-4 text-sm font-bold">Ganti Password</h2>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const result = await run("change-password", () =>
              changePasswordAction(currentPassword, newPassword),
            );
            if (result.ok) {
              setCurrentPassword("");
              setNewPassword("");
            }
          }}
          className="grid gap-3 md:grid-cols-2"
        >
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-white/60">
              Password saat ini
            </span>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className={inputClass}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-white/60">
              Password baru (min. 8)
            </span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className={inputClass}
              required
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={busy === "change-password"}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-white/80 transition hover:bg-white/10 disabled:opacity-50"
            >
              {busy === "change-password" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Simpan password
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

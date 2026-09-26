import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser, safeNextPath } from "@/lib/auth-user";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = safeNextPath(params.next ?? null);

  if (await getCurrentUser()) redirect(next);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <LoginForm
        next={next}
        initialError={params.error === "auth" ? "Gagal masuk. Coba lagi." : undefined}
      />
    </div>
  );
}

import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getAdminId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getAdminId()) redirect("/admin");

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <LoginForm />
    </div>
  );
}

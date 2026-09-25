import { requireAdminPage } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: LayoutProps<"/admin">) {
  await requireAdminPage();
  return <>{children}</>;
}

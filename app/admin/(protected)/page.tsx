import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getAdminOverview } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const overview = await getAdminOverview();
  return <AdminDashboard overview={overview} />;
}

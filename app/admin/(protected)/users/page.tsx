import { UserMoodList } from "@/components/admin/UserMoodList";
import { getUserMoodStats } from "@/lib/data";

export const dynamic = "force-dynamic";

type UsersPageProps = {
  searchParams: Promise<{ page?: string; q?: string }>;
};

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;
  const parsedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const query = params.q ?? "";

  const result = await getUserMoodStats({ page, search: query });

  return <UserMoodList key={query} {...result} initialQuery={query} />;
}

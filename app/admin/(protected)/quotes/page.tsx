import { QuoteList } from "@/components/admin/QuoteList";
import { getQuotesForAdmin } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminQuotesPage() {
  const quotes = await getQuotesForAdmin();
  return <QuoteList quotes={quotes} />;
}

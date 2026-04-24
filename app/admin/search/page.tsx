import { getPersonProfile, searchPeople } from "@/lib/data";
import { PersonSearchPage } from "@/components/person-search-page";
import { logAuditEvent } from "@/lib/audit";

type AdminSearchPageProps = {
  searchParams?: {
    q?: string;
    id?: string;
    type?: "member" | "trainer";
    status?: string;
  };
};

export default async function AdminSearchPage({ searchParams }: AdminSearchPageProps) {
  const query = searchParams?.q?.trim() ?? "";
  const type = searchParams?.type === "trainer" ? "trainer" : "member";
  const results = query ? await searchPeople(query) : [];
  const profile = searchParams?.id ? await getPersonProfile(searchParams.id, type) : null;

  if (query) {
    await logAuditEvent({
      actorRole: "admin",
      actorCode: "ADMIN",
      actionCode: "admin_search",
      status: "success",
      targetType: "system",
      context: "admin_search",
      detail: `Search query: ${query}`,
      meta: { resultCount: results.length }
    });
  }

  if (profile) {
    await logAuditEvent({
      actorRole: "admin",
      actorCode: "ADMIN",
      actionCode: "admin_view_profile",
      status: "success",
      targetType: profile.result.type,
      targetCode: profile.result.code,
      context: "admin_search"
    });
  }

  return <PersonSearchPage viewer="admin" query={query} results={results} profile={profile} status={searchParams?.status} />;
}

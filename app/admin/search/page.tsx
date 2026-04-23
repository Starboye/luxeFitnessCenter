import { getPersonProfile, searchPeople } from "@/lib/data";
import { PersonSearchPage } from "@/components/person-search-page";

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

  return <PersonSearchPage viewer="admin" query={query} results={results} profile={profile} status={searchParams?.status} />;
}

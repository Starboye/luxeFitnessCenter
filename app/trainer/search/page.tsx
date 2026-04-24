import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPersonProfile, searchPeople } from "@/lib/data";
import { PersonSearchPage } from "@/components/person-search-page";
import { logAuditEvent } from "@/lib/audit";

type TrainerSearchPageProps = {
  searchParams?: {
    q?: string;
    id?: string;
    type?: "member" | "trainer";
  };
};

export default async function TrainerSearchPage({ searchParams }: TrainerSearchPageProps) {
  const trainerSession = cookies().get("luxe_trainer_session")?.value;

  if (!trainerSession) {
    redirect("/trainer-access");
  }

  const query = searchParams?.q?.trim() ?? "";
  const type = searchParams?.type === "trainer" ? "trainer" : "member";
  const results = query ? await searchPeople(query) : [];
  const profile = searchParams?.id ? await getPersonProfile(searchParams.id, type) : null;

  if (query) {
    await logAuditEvent({
      actorRole: "trainer",
      actorCode: trainerSession,
      actionCode: "trainer_search",
      status: "success",
      targetType: "system",
      context: "trainer_search",
      detail: `Search query: ${query}`,
      meta: { resultCount: results.length }
    });
  }

  if (profile) {
    await logAuditEvent({
      actorRole: "trainer",
      actorCode: trainerSession,
      actionCode: "trainer_view_profile",
      status: "success",
      targetType: profile.result.type,
      targetCode: profile.result.code,
      context: "trainer_search"
    });
  }

  return <PersonSearchPage viewer="trainer" query={query} results={results} profile={profile} />;
}

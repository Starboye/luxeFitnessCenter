import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPersonProfile, searchPeople } from "@/lib/data";
import { PersonSearchPage } from "@/components/person-search-page";

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

  return <PersonSearchPage viewer="trainer" query={query} results={results} profile={profile} />;
}

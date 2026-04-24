import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TrainerDashboardPage } from "@/components/trainer-dashboard-page";

export default function TrainerPage() {
  const trainerSession = cookies().get("luxe_trainer_session")?.value;

  if (!trainerSession) {
    redirect("/trainer-access");
  }

  return <TrainerDashboardPage />;
}

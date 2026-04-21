import { trainerAttendanceAction } from "@/app/actions";

export function TrainerAttendanceForm() {
  return (
    <form action={trainerAttendanceAction} className="cluster">
      <button className="button" type="submit" name="action" value="login">
        Mark trainer login
      </button>
      <button className="button-ghost" type="submit" name="action" value="logout">
        Mark trainer logout
      </button>
    </form>
  );
}

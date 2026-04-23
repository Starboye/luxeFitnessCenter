import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getTrainerDashboardData } from "@/lib/data";
import { recordTrainerAttendance } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getTrainerCodeFromRequest(request: Request) {
  const cookieStore = cookies();
  const directCookie = cookieStore.get("luxe_trainer_session")?.value;
  if (directCookie) {
    return directCookie;
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/luxe_trainer_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export async function GET(request: Request) {
  try {
    const trainerCode = getTrainerCodeFromRequest(request);

    if (!trainerCode) {
      return NextResponse.json({ error: "Trainer login required." }, { status: 401 });
    }

    const data = await getTrainerDashboardData(trainerCode);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load trainer dashboard."
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const action = String(formData.get("action") ?? "login") as "login" | "logout";
    const trainerCode = getTrainerCodeFromRequest(request);

    if (!trainerCode) {
      return NextResponse.json({ error: "Trainer login required." }, { status: 401 });
    }

    await recordTrainerAttendance(action, trainerCode);
    const data = await getTrainerDashboardData(trainerCode);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to update trainer attendance."
      },
      { status: 500 }
    );
  }
}

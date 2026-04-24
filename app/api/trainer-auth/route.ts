import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

function shouldUseSecureCookie(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();

  if (forwardedProto) {
    return forwardedProto === "https";
  }

  return new URL(request.url).protocol === "https:";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { trainerCode?: string };
    const trainerCode = String(body.trainerCode ?? "").trim().toUpperCase();

    if (!trainerCode) {
      return NextResponse.json({ ok: false, message: "Trainer Luxe ID is required." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: trainer, error } = await supabase
      .from("staff")
      .select("id, staff_code, role, active, profiles(full_name)")
      .eq("staff_code", trainerCode)
      .eq("role", "trainer")
      .eq("active", true)
      .single();

    if (error || !trainer) {
      return NextResponse.json({ ok: false, message: "Trainer Luxe ID not found." }, { status: 404 });
    }

    const response = NextResponse.json({
      ok: true,
      trainer: {
        id: trainer.id,
        staffCode: trainer.staff_code,
        fullName: (trainer.profiles as any)?.full_name || "Trainer"
      }
    });

    response.cookies.set("luxe_trainer_session", trainerCode, {
      httpOnly: true,
      sameSite: "lax",
      secure: shouldUseSecureCookie(request),
      path: "/",
      maxAge: 60 * 60 * 8
    });

    return response;
  } catch {
    return NextResponse.json({ ok: false, message: "Unable to verify trainer right now." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("luxe_trainer_session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(request),
    path: "/",
    maxAge: 0
  });
  return response;
}

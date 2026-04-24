import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logAuditEvent } from "@/lib/audit";

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
      await logAuditEvent({
        actorRole: "trainer",
        actionCode: "trainer_login",
        status: "blocked",
        targetType: "trainer",
        context: "trainer_access",
        detail: "Trainer code missing."
      });
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
      await logAuditEvent({
        actorRole: "trainer",
        actorCode: trainerCode,
        actionCode: "trainer_login",
        status: "blocked",
        targetType: "trainer",
        targetCode: trainerCode,
        context: "trainer_access",
        detail: "Trainer Luxe ID not found."
      });
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

    await logAuditEvent({
      actorRole: "trainer",
      actorCode: trainerCode,
      actionCode: "trainer_login",
      status: "success",
      targetType: "trainer",
      targetCode: trainer.staff_code,
      context: "trainer_access"
    });

    return response;
  } catch (error) {
    await logAuditEvent({
      actorRole: "trainer",
      actionCode: "trainer_login",
      status: "error",
      targetType: "trainer",
      context: "trainer_access",
      detail: error instanceof Error ? error.message : "Unable to verify trainer."
    });
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
  await logAuditEvent({
    actorRole: "trainer",
    actionCode: "trainer_logout",
    status: "success",
    targetType: "trainer",
    context: "trainer_access"
  });
  return response;
}

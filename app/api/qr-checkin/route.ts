import { NextResponse } from "next/server";
import { markMemberAttendance } from "@/lib/data";
import { logAuditEvent } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { memberCode?: string };
    const memberCode = body.memberCode?.trim();

    if (!memberCode) {
      await logAuditEvent({
        actorRole: "member",
        actionCode: "member_checkin",
        status: "blocked",
        targetType: "member",
        context: "qr_api",
        detail: "Member code missing."
      });
      return NextResponse.json({ ok: false, message: "Add a member ID for the demo QR flow." }, { status: 400 });
    }

    const result = await markMemberAttendance(memberCode, "qr");
    await logAuditEvent({
      actorRole: "member",
      actorCode: memberCode.toUpperCase(),
      actionCode: "member_checkin",
      status: result.ok ? "success" : "blocked",
      targetType: "member",
      targetCode: result.member?.memberCode ?? memberCode.toUpperCase(),
      context: "qr_api",
      detail: result.message
    });
    return NextResponse.json(result);
  } catch (error) {
    await logAuditEvent({
      actorRole: "member",
      actionCode: "member_checkin",
      status: "error",
      targetType: "member",
      context: "qr_api",
      detail: error instanceof Error ? error.message : "QR API error."
    });
    return NextResponse.json({ ok: false, message: "Unable to complete check-in right now." }, { status: 500 });
  }
}

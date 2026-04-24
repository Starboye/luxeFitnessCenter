import { NextResponse } from "next/server";
import { findMemberByCode } from "@/lib/data";
import { logAuditEvent } from "@/lib/audit";

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { memberCode?: string; phone?: string };
    const memberCode = body.memberCode?.trim() ?? "";
    const phone = body.phone?.trim() ?? "";

    if (!memberCode || !phone) {
      await logAuditEvent({
        actorRole: "member",
        actorCode: memberCode.toUpperCase() || null,
        actionCode: "member_verify",
        status: "blocked",
        targetType: "member",
        targetCode: memberCode.toUpperCase() || null,
        context: "member_auth",
        detail: "Member ID or phone missing."
      });
      return NextResponse.json({ ok: false, message: "Member ID and phone number are required." }, { status: 400 });
    }

    const member = await findMemberByCode(memberCode);

    if (!member) {
      await logAuditEvent({
        actorRole: "member",
        actorCode: memberCode.toUpperCase(),
        actionCode: "member_verify",
        status: "blocked",
        targetType: "member",
        targetCode: memberCode.toUpperCase(),
        context: "member_auth",
        detail: "Member ID not found."
      });
      return NextResponse.json({ ok: false, message: "We couldn't find that member ID." }, { status: 404 });
    }

    if (!member.phone || normalizePhone(member.phone) !== normalizePhone(phone)) {
      await logAuditEvent({
        actorRole: "member",
        actorCode: member.memberCode,
        actionCode: "member_verify",
        status: "blocked",
        targetType: "member",
        targetCode: member.memberCode,
        context: "member_auth",
        detail: "Phone number mismatch."
      });
      return NextResponse.json({ ok: false, message: "Phone number does not match this member ID." }, { status: 400 });
    }

    await logAuditEvent({
      actorRole: "member",
      actorCode: member.memberCode,
      actionCode: "member_verify",
      status: "success",
      targetType: "member",
      targetCode: member.memberCode,
      context: "member_auth"
    });

    return NextResponse.json({
      ok: true,
      message: "Member verified. Continue with OTP to save this device for future check-ins.",
      member
    });
  } catch (error) {
    await logAuditEvent({
      actorRole: "member",
      actionCode: "member_verify",
      status: "error",
      targetType: "member",
      context: "member_auth",
      detail: error instanceof Error ? error.message : "Member verification failed."
    });
    return NextResponse.json({ ok: false, message: "Unable to verify member right now." }, { status: 500 });
  }
}

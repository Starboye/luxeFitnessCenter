import { NextResponse } from "next/server";
import { findMemberByCode } from "@/lib/data";

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export async function POST(request: Request) {
  const body = (await request.json()) as { memberCode?: string; phone?: string };
  const memberCode = body.memberCode?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";

  if (!memberCode || !phone) {
    return NextResponse.json({ ok: false, message: "Member ID and phone number are required." }, { status: 400 });
  }

  const member = await findMemberByCode(memberCode);

  if (!member) {
    return NextResponse.json({ ok: false, message: "We couldn't find that member ID." }, { status: 404 });
  }

  if (!member.phone || normalizePhone(member.phone) !== normalizePhone(phone)) {
    return NextResponse.json({ ok: false, message: "Phone number does not match this member ID." }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message: "Member verified. Continue with OTP to save this device for future check-ins.",
    member
  });
}

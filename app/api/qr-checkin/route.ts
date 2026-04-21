import { NextResponse } from "next/server";
import { markMemberAttendance } from "@/lib/data";

export async function POST(request: Request) {
  const body = (await request.json()) as { memberCode?: string };
  const memberCode = body.memberCode?.trim();

  if (!memberCode) {
    return NextResponse.json({ ok: false, message: "Add a member ID for the demo QR flow." }, { status: 400 });
  }

  const result = await markMemberAttendance(memberCode, "qr");
  return NextResponse.json(result);
}

// import { NextResponse } from "next/server";
// import { markMemberAttendance } from "@/lib/data";

// export async function POST(request: Request) {
//   const body = (await request.json()) as { memberCode?: string };
//   const memberCode = body.memberCode?.trim();

//   if (!memberCode) {
//     return NextResponse.json({ ok: false, message: "Enter a valid member ID to continue." }, { status: 400 });
//   }

//   const result = await markMemberAttendance(memberCode, "kiosk");
//   return NextResponse.json(result);
// }

import { NextRequest, NextResponse } from "next/server";
import { markMemberAttendance } from "@/lib/data";
import { logAuditEvent } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    // 1. Parse the incoming request
    const body = await request.json();
    const { memberCode } = body;

    // 2. Validate input
    if (!memberCode) {
      await logAuditEvent({
        actorRole: "member",
        actionCode: "member_checkin",
        status: "blocked",
        targetType: "member",
        context: "kiosk_api",
        detail: "Member code missing."
      });
      return NextResponse.json(
        { ok: false, message: "Member ID is required." },
        { status: 400 }
      );
    }

    // 3. Execute the attendance logic
    const result = await markMemberAttendance(memberCode, "kiosk");
    await logAuditEvent({
      actorRole: "member",
      actorCode: String(memberCode).trim().toUpperCase(),
      actionCode: "member_checkin",
      status: result.ok ? "success" : "blocked",
      targetType: "member",
      targetCode: result.member?.memberCode ?? String(memberCode).trim().toUpperCase(),
      context: "kiosk_api",
      detail: result.message
    });

    // 4. Return the result as JSON
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("KIOSK_API_ERROR:", error);
    await logAuditEvent({
      actorRole: "member",
      actionCode: "member_checkin",
      status: "error",
      targetType: "member",
      context: "kiosk_api",
      detail: error?.message ?? "Kiosk API error."
    });
    
    // Always return JSON even on failure to prevent frontend "Unexpected end of JSON" errors
    return NextResponse.json(
      { 
        ok: false, 
        message: "Internal Server Error. Please contact admin.",
        error: error.message 
      },
      { status: 500 }
    );
  }
}

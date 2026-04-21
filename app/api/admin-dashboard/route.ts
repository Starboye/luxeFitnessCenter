// import { NextResponse } from "next/server";
// import { getAdminDashboardData } from "@/lib/data";

// export const dynamic = "force-dynamic";
// export const revalidate = 0;

// export async function GET() {
//   const data = await getAdminDashboardData();
//   return NextResponse.json(data, {
//     headers: {
//       "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
//     }
//   });
// }


// ----------------------
// import { NextRequest, NextResponse } from "next/server";
// import { getAdminDashboardData } from "@/lib/data";

// export const dynamic = "force-dynamic";

// export async function GET(request: NextRequest) {
//   const { searchParams } = new URL(request.url);
//   const date = searchParams.get("date") || new Date().toISOString().split('T')[0];

//   // Pass the date to your data fetching function
//   const data = await getAdminDashboardData(date);
  
//   return NextResponse.json(data, {
//     headers: {
//       "Cache-Control": "no-store, no-cache, must-revalidate"
//     }
//   });
// }

// ------------------------


import { NextRequest, NextResponse } from "next/server";
import { getAdminDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().split('T')[0];

  try {
    const data = await getAdminDashboardData(date);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
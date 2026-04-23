import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase-server";

const PHOTO_BUCKET = "profile-photos";

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin credentials are missing.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function isSafePhotoPath(photoPath: string) {
  return /^(members|trainers)\/[a-zA-Z0-9-]+\.[a-zA-Z0-9]+$/.test(photoPath);
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return new NextResponse("Photo storage is not configured.", { status: 404 });
  }

  const photoPath = request.nextUrl.searchParams.get("path") ?? "";

  if (!isSafePhotoPath(photoPath)) {
    return new NextResponse("Invalid photo path.", { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage.from(PHOTO_BUCKET).download(photoPath);

    if (error || !data) {
      return new NextResponse("Photo not found.", { status: 404 });
    }

    return new NextResponse(data, {
      headers: {
        "Content-Type": data.type || "application/octet-stream",
        "Cache-Control": "private, max-age=3600"
      }
    });
  } catch {
    return new NextResponse("Unable to load photo.", { status: 500 });
  }
}

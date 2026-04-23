// "use server";

// import { redirect } from "next/navigation";
// import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase-server";
// import { KioskCheckInResponse } from "@/lib/types";
// import { markMemberAttendance, recordTrainerAttendance } from "@/lib/data";

// export async function kioskCheckInAction(_: KioskCheckInResponse, formData: FormData) {
//   const memberCode = String(formData.get("memberCode") ?? "").trim();

//   if (!memberCode) {
//     return { ok: false, message: "Enter a valid member ID to continue." };
//   }

//   return markMemberAttendance(memberCode, "kiosk");
// }

// export async function quickQrCheckInAction(_: KioskCheckInResponse, formData: FormData) {
//   const memberCode = String(formData.get("memberCode") ?? "").trim();

//   if (!memberCode) {
//     return { ok: false, message: "Add a member ID for the demo QR flow." };
//   }

//   return markMemberAttendance(memberCode, "qr");
// }

// export async function trainerAttendanceAction(formData: FormData) {
//   const action = String(formData.get("action") ?? "login") as "login" | "logout";
//   await recordTrainerAttendance(action);
// }

// export async function trainerSignInAction(formData: FormData) {
//   if (!isSupabaseConfigured()) {
//     redirect("/trainer?demo=1");
//   }

//   const email = String(formData.get("email") ?? "");
//   const password = String(formData.get("password") ?? "");
//   const supabase = createSupabaseServerClient();

//   await supabase.auth.signInWithPassword({ email, password });
//   redirect("/trainer");
// }

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase-server";
import { KioskCheckInResponse } from "@/lib/types";
import { markMemberAttendance, recordTrainerAttendance } from "@/lib/data";

const ADMIN_SESSION_VALUE = "active";
const PHOTO_BUCKET = "profile-photos";
const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024;
let photoBucketReady = false;

/**
 * SHARED KIOSK ACTION
 * Processes ID entry from the front-desk tablet.
 */
export async function kioskCheckInAction(_: any, formData: FormData): Promise<KioskCheckInResponse> {
  const memberCode = String(formData.get("memberCode") ?? "").trim().toUpperCase();

  if (!memberCode) {
    return { ok: false, message: "Enter a valid member ID to continue." };
  }

  try {
    const result = await markMemberAttendance(memberCode, "kiosk");
    revalidatePath("/admin"); // Refresh admin dashboard stats
    return result;
  } catch (error) {
    return { ok: false, message: "System offline. Please see reception." };
  }
}

/**
 * QR FLOW ACTION
 * Processes check-ins from the member's personal device.
 */
export async function quickQrCheckInAction(_: any, formData: FormData): Promise<KioskCheckInResponse> {
  const memberCode = String(formData.get("memberCode") ?? "").trim().toUpperCase();

  if (!memberCode) {
    return { ok: false, message: "Member ID required for verification." };
  }

  const result = await markMemberAttendance(memberCode, "qr");
  revalidatePath("/admin");
  return result;
}

/**
 * TRAINER ATTENDANCE ACTION
 * Handles Clock-In/Clock-Out for staff.
 */
export async function trainerAttendanceAction(formData: FormData) {
  const action = String(formData.get("action") ?? "login") as "login" | "logout";
  
  try {
    await recordTrainerAttendance(action);
    revalidatePath("/trainer");
    revalidatePath("/admin");
  } catch (e) {
    console.error("Attendance sync failed");
  }
}

/**
 * TRAINER LOGIN ACTION
 * Validates credentials or redirects to demo mode if Supabase is missing.
 */
export async function trainerSignInAction(formData: FormData) {
  // If no Supabase URL/Key is found, fallback to demo mode automatically
  if (!isSupabaseConfigured()) {
    redirect("/trainer?demo=1&status=demo-mode");
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/trainer?error=invalid-credentials");
  }

  redirect("/trainer?status=signed-in");
}

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("supabase-not-configured");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function parseMoney(value: FormDataEntryValue | null) {
  const parsed = Number(String(value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBoolean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim() === "true";
}

function redirectWithError(path: string, code: string, detail?: string): never {
  const params = new URLSearchParams({ error: code });
  if (detail) {
    params.set("detail", detail);
  }
  redirect(`${path}?${params.toString()}`);
}

function formatDbError(error: { message?: string; details?: string | null; hint?: string | null }) {
  return [error.message, error.details, error.hint].filter(Boolean).join(" | ");
}

function sanitizeFileExtension(fileName: string, mimeType: string) {
  const fromName = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() : "";
  if (fromName && ["jpg", "jpeg", "png", "webp"].includes(fromName)) {
    return fromName;
  }

  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "jpg";
}

async function ensurePhotoBucket(supabase: ReturnType<typeof createAdminClient>) {
  if (photoBucketReady) {
    return;
  }

  const { data: existingBucket, error: bucketLookupError } = await supabase.storage.getBucket(PHOTO_BUCKET);

  if (bucketLookupError && !bucketLookupError.message.toLowerCase().includes("not found")) {
    throw new Error(bucketLookupError.message);
  }

  if (!existingBucket) {
    const { error: createBucketError } = await supabase.storage.createBucket(PHOTO_BUCKET, {
      public: false,
      fileSizeLimit: MAX_PHOTO_SIZE_BYTES,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"]
    });

    if (createBucketError && !createBucketError.message.toLowerCase().includes("already exists")) {
      throw new Error(createBucketError.message);
    }
  }

  photoBucketReady = true;
}

async function removeProfilePhoto(
  supabase: ReturnType<typeof createAdminClient>,
  photoPath?: string | null
) {
  if (!photoPath) {
    return;
  }

  await supabase.storage.from(PHOTO_BUCKET).remove([photoPath]);
}

async function uploadProfilePhoto(
  supabase: ReturnType<typeof createAdminClient>,
  file: FormDataEntryValue | null,
  folder: "members" | "trainers",
  recordId: string
) {
  const maybeFile = file as {
    size?: number;
    type?: string;
    name?: string;
    arrayBuffer?: () => Promise<ArrayBuffer>;
  } | null;

  if (!maybeFile || typeof maybeFile.arrayBuffer !== "function" || !maybeFile.size) {
    return null;
  }

  if (!maybeFile.type?.startsWith("image/")) {
    throw new Error("Only image uploads are supported.");
  }

  if (maybeFile.size > MAX_PHOTO_SIZE_BYTES) {
    throw new Error("Image size must stay under 2MB.");
  }

  const extension = sanitizeFileExtension(maybeFile.name ?? "photo.jpg", maybeFile.type);
  const photoPath = `${folder}/${recordId}.${extension}`;
  const arrayBuffer = await maybeFile.arrayBuffer();

  await ensurePhotoBucket(supabase);

  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(photoPath, arrayBuffer, {
    contentType: maybeFile.type,
    upsert: true
  });

  if (error) {
    throw new Error(error.message);
  }

  return photoPath;
}

export async function adminPanelLoginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.ADMIN_PANEL_PASSWORD;

  if (!expected) {
    redirect("/admin-access?error=missing-password-config");
  }

  if (password !== expected) {
    redirect("/admin-access?error=invalid-password");
  }

  cookies().set("luxe_admin_session", ADMIN_SESSION_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });

  redirect("/admin");
}

export async function adminPanelLogoutAction() {
  cookies().set("luxe_admin_session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  redirect("/admin-access");
}

export async function createMemberAction(formData: FormData) {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    redirect("/admin/manage?error=supabase-not-configured");
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const memberCode = String(formData.get("memberCode") ?? "").trim().toUpperCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const packageId = String(formData.get("packageId") ?? "").trim();
  const personalTrainerId = String(formData.get("personalTrainerId") ?? "").trim();
  const membershipStatus = String(formData.get("membershipStatus") ?? "active").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  const dueAmount = parseMoney(formData.get("dueAmount"));
  const photoFile = formData.get("photo");

  if (!fullName || !memberCode || !phone || !packageId || !startDate) {
    redirectWithError("/admin/manage", "missing-required-fields");
  }

  if (dueAmount === null) {
    redirectWithError("/admin/manage", "invalid-number");
  }

  const supabase = createAdminClient();
  const { data: membershipPackage, error: packageError } = await supabase
    .from("membership_packages")
    .select("id, name, duration_days, price")
    .eq("id", packageId)
    .eq("active", true)
    .single();

  if (packageError || !membershipPackage) {
    redirectWithError("/admin/manage", "package-not-found", packageError ? formatDbError(packageError) : undefined);
  }

  const selectedPackage = membershipPackage;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + Number(selectedPackage.duration_days) - 1);
  const endDate = end.toISOString().slice(0, 10);
  const totalFee = Number(selectedPackage.price ?? 0);
  let photoPath: string | null = null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert({
      full_name: fullName,
      email: email || null,
      phone
    })
    .select("id")
    .single();

  if (profileError) {
    redirectWithError(
      "/admin/manage",
      profileError.code === "23505" ? "profile-contact-exists" : "database-error",
      formatDbError(profileError)
    );
  }

  if (!profile) {
    redirectWithError("/admin/manage", "database-error", "Profile creation returned no record.");
  }

  try {
    photoPath = await uploadProfilePhoto(supabase, photoFile, "members", profile.id);
    if (photoPath) {
      const { error: photoUpdateError } = await supabase.from("profiles").update({ photo_path: photoPath }).eq("id", profile.id);
      if (photoUpdateError) {
        throw new Error(photoUpdateError.message);
      }
    }
  } catch (error) {
    await removeProfilePhoto(supabase, photoPath);
    await supabase.from("profiles").delete().eq("id", profile.id);
    redirectWithError("/admin/manage", "database-error", error instanceof Error ? error.message : "Unable to upload member photo.");
  }

  const { data: member, error: memberError } = await supabase
    .from("members")
    .insert({
      profile_id: profile.id,
      member_code: memberCode,
      personal_trainer_id: personalTrainerId || null,
      active: membershipStatus !== "expired"
    })
    .select("id")
    .single();

  if (memberError) {
    await removeProfilePhoto(supabase, photoPath);
    await supabase.from("profiles").delete().eq("id", profile.id);
    redirectWithError(
      "/admin/manage",
      memberError.code === "23505" ? "member-code-exists" : "database-error",
      formatDbError(memberError)
    );
  }

  if (!member) {
    await removeProfilePhoto(supabase, photoPath);
    await supabase.from("profiles").delete().eq("id", profile.id);
    redirectWithError("/admin/manage", "database-error", "Member creation returned no record.");
  }

  const { error: membershipError } = await supabase.from("memberships").insert({
    member_id: member.id,
    plan_name: selectedPackage.name,
    start_date: startDate,
    end_date: endDate,
    total_fee: totalFee,
    due_amount: dueAmount,
    status: membershipStatus
  });

  if (membershipError) {
    await removeProfilePhoto(supabase, photoPath);
    await supabase.from("members").delete().eq("id", member.id);
    redirectWithError("/admin/manage", "database-error", formatDbError(membershipError));
  }

  revalidatePath("/admin");
  revalidatePath("/admin/manage");
  redirect("/admin/manage?status=member-created");
}

export async function updateMemberAction(formData: FormData) {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    redirect("/admin/manage?error=supabase-not-configured");
  }

  const memberId = String(formData.get("memberId") ?? "").trim();
  const profileId = String(formData.get("profileId") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const personalTrainerId = String(formData.get("personalTrainerId") ?? "").trim();
  const membershipStatus = String(formData.get("membershipStatus") ?? "").trim();
  const dueAmount = parseMoney(formData.get("dueAmount"));

  if (!memberId || !profileId || !fullName || !phone || dueAmount === null) {
    redirectWithError("/admin/search", "missing-required-fields");
  }

  const supabase = createAdminClient();
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone,
      email: email || null
    })
    .eq("id", profileId);

  if (profileError) {
    redirectWithError("/admin/search", "database-error", formatDbError(profileError));
  }

  const { error: memberError } = await supabase
    .from("members")
    .update({
      personal_trainer_id: personalTrainerId || null
    })
    .eq("id", memberId);

  if (memberError) {
    redirectWithError("/admin/search", "database-error", formatDbError(memberError));
  }

  const { data: latestMembership } = await supabase
    .from("memberships")
    .select("id")
    .eq("member_id", memberId)
    .order("end_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestMembership) {
    const { error: membershipError } = await supabase
      .from("memberships")
      .update({
        due_amount: dueAmount,
        status: membershipStatus || undefined
      })
      .eq("id", latestMembership.id);

    if (membershipError) {
      redirectWithError("/admin/search", "database-error", formatDbError(membershipError));
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/search");
  revalidatePath("/trainer");
  revalidatePath("/check-in");
  redirect("/admin/search?status=member-updated");
}

export async function createTrainerAction(formData: FormData) {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    redirect("/admin/manage?error=supabase-not-configured");
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const staffCode = String(formData.get("staffCode") ?? "").trim().toUpperCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const specialization = String(formData.get("specialization") ?? "").trim();
  const role = String(formData.get("role") ?? "trainer").trim();
  const photoFile = formData.get("photo");
  let photoPath: string | null = null;

  if (!fullName || !staffCode || !phone || !role) {
    redirectWithError("/admin/manage", "missing-required-fields");
  }

  const supabase = createAdminClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert({
      full_name: fullName,
      email: email || null,
      phone
    })
    .select("id")
    .single();

  if (profileError) {
    redirectWithError(
      "/admin/manage",
      profileError.code === "23505" ? "profile-contact-exists" : "database-error",
      formatDbError(profileError)
    );
  }

  if (!profile) {
    redirectWithError("/admin/manage", "database-error", "Trainer profile creation returned no record.");
  }

  try {
    photoPath = await uploadProfilePhoto(supabase, photoFile, "trainers", profile.id);
    if (photoPath) {
      const { error: photoUpdateError } = await supabase.from("profiles").update({ photo_path: photoPath }).eq("id", profile.id);
      if (photoUpdateError) {
        throw new Error(photoUpdateError.message);
      }
    }
  } catch (error) {
    await removeProfilePhoto(supabase, photoPath);
    await supabase.from("profiles").delete().eq("id", profile.id);
    redirectWithError("/admin/manage", "database-error", error instanceof Error ? error.message : "Unable to upload trainer photo.");
  }

  const { error: staffError } = await supabase.from("staff").insert({
    profile_id: profile.id,
    staff_code: staffCode,
    role,
    specialization: specialization || null,
    active: true
  });

  if (staffError) {
    await removeProfilePhoto(supabase, photoPath);
    await supabase.from("profiles").delete().eq("id", profile.id);
    redirectWithError(
      "/admin/manage",
      staffError.code === "23505" ? "trainer-code-exists" : "database-error",
      formatDbError(staffError)
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/manage");
  redirect("/admin/manage?status=trainer-created");
}

export async function createMembershipPackageAction(formData: FormData) {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    redirect("/admin/manage?error=supabase-not-configured");
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const durationDays = Number(String(formData.get("durationDays") ?? "").trim());
  const price = parseMoney(formData.get("price"));
  const active = parseBoolean(formData.get("active"));

  if (!name || !Number.isFinite(durationDays) || durationDays <= 0 || price === null) {
    redirectWithError("/admin/manage", "invalid-number");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("membership_packages").insert({
    name,
    description: description || null,
    duration_days: durationDays,
    price,
    active
  });

  if (error) {
    redirectWithError(
      "/admin/manage",
      error.code === "23505" ? "package-name-exists" : "database-error",
      formatDbError(error)
    );
  }

  revalidatePath("/admin/manage");
  redirect("/admin/manage?status=package-created");
}

export async function recordMemberPaymentAction(formData: FormData) {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    redirect("/admin/manage?error=supabase-not-configured");
  }

  const memberId = String(formData.get("memberId") ?? "").trim();
  const amount = parseMoney(formData.get("amount"));
  const method = String(formData.get("method") ?? "cash").trim();
  const paidOn = String(formData.get("paidOn") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const dueReductionInput = parseMoney(formData.get("dueReduction"));

  if (!memberId || amount === null || !paidOn) {
    redirectWithError("/admin/manage", "missing-required-fields");
  }

  const dueReduction = dueReductionInput === null || dueReductionInput === 0 ? amount : dueReductionInput;

  const supabase = createAdminClient();
  const { data: memberships, error: membershipError } = await supabase
    .from("memberships")
    .select("id, due_amount, status")
    .eq("member_id", memberId)
    .order("end_date", { ascending: false })
    .limit(1);

  if (membershipError) {
    redirectWithError("/admin/manage", "member-not-found", formatDbError(membershipError));
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    member_id: memberId,
    amount,
    method,
    paid_on: paidOn,
    notes: notes || null
  });

  if (paymentError) {
    redirectWithError("/admin/manage", "payment-insert-failed", formatDbError(paymentError));
  }

  const latestMembership = memberships?.[0];
  if (latestMembership && dueReduction > 0) {
    const nextDue = Math.max(Number(latestMembership.due_amount ?? 0) - dueReduction, 0);
    const nextStatus = nextDue === 0 && latestMembership.status === "due" ? "active" : latestMembership.status;

    await supabase
      .from("memberships")
      .update({
        due_amount: nextDue,
        status: nextStatus
      })
      .eq("id", latestMembership.id);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/manage");
  redirect("/admin/manage?status=payment-recorded");
}

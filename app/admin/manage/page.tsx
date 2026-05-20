import type { CSSProperties } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import {
  createMemberAction,
  createMembershipPackageAction,
  createTrainerAction,
  recordMemberPaymentAction
} from "@/app/actions";
import { AutoDismissToast } from "@/components/auto-dismiss-toast";
import { ManageFormDraftController } from "@/components/manage-form-draft-controller";
import { MemberPackageSelector } from "@/components/member-package-selector";
import { isSupabaseConfigured } from "@/lib/supabase-server";

type ManagePageProps = {
  searchParams?: {
    status?: string;
    error?: string;
    detail?: string;
  };
};

type MemberOption = {
  id: string;
  member_code: string;
  profiles?: { full_name?: string | null } | null;
};

type PackageOption = {
  id: string;
  name: string;
  duration_days: number;
  price: number | string;
  active: boolean;
};

type TrainerOption = {
  id: string;
  staff_code: string;
  profiles?: { full_name?: string | null } | null;
};

type StaffCodeOption = {
  staff_code: string;
};

function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function getStatusMessage(status?: string) {
  switch (status) {
    case "member-created":
      return "New gym member created successfully.";
    case "trainer-created":
      return "New trainer created successfully.";
    case "package-created":
      return "New gym package added successfully.";
    case "payment-recorded":
      return "Payment has been recorded successfully.";
    case "member-updated":
      return "Member details updated successfully.";
    default:
      return null;
  }
}

function getErrorMessage(error?: string, detail?: string) {
  switch (error) {
    case "supabase-not-configured":
      return "Supabase is not configured in this environment yet.";
    case "missing-required-fields":
      return "Please fill in all required fields before submitting.";
    case "invalid-number":
      return "Please enter valid numeric values.";
    case "invalid-date-range":
      return "Membership start date must be before end date.";
    case "member-code-exists":
      return "That member code already exists.";
    case "trainer-code-exists":
      return "That trainer Luxe ID already exists.";
    case "profile-contact-exists":
      return "That phone number or email is already in use.";
    case "package-name-exists":
      return "That package name already exists.";
    case "member-not-found":
      return "The selected member could not be found.";
    case "package-not-found":
      return "Please create an active gym package first, then add the member.";
    case "payment-insert-failed":
      return "Unable to record payment right now.";
    case "database-error":
      if (detail?.includes("photo_path")) {
        return "The database is missing the new photo column. Run the latest Supabase schema update, then try the upload again.";
      }
      return detail ? `Database error: ${detail}` : "A database error occurred while saving the form.";
    default:
      return detail || (error ? "Something went wrong while saving the form." : null);
  }
}

function getNextSequentialCode(codes: string[], prefix: string, minValue: number) {
  const maxValue = codes.reduce((highest, code) => {
    const match = code.toUpperCase().match(new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\d+)$`));
    if (!match) {
      return highest;
    }

    return Math.max(highest, Number.parseInt(match[1], 10));
  }, minValue - 1);

  const nextValue = maxValue + 1;
  return `${prefix}${String(nextValue).padStart(3, "0")}`;
}

async function peekGeneratedCode(
  supabase: ReturnType<typeof createAdminClient>,
  rpcName: "peek_member_code" | "peek_trainer_code",
  fallbackCode: string
) {
  const { data, error } = await supabase.rpc(rpcName);
  if (error || typeof data !== "string" || !data.trim()) {
    return fallbackCode;
  }

  return data.trim().toUpperCase();
}

export default async function AdminManagePage({ searchParams }: ManagePageProps) {
  let members: MemberOption[] = [];
  let packages: PackageOption[] = [];
  let trainers: TrainerOption[] = [];
  let staffCodeRows: StaffCodeOption[] = [];

  if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createAdminClient();
    const [{ data: memberRows }, { data: packageRows }, { data: trainerRows }, { data: allStaffRows }] = await Promise.all([
      supabase.from("members").select("id, member_code, profiles(full_name)").order("member_code"),
      supabase.from("membership_packages").select("id, name, duration_days, price, active").order("created_at", { ascending: false }),
      supabase.from("staff").select("id, staff_code, profiles(full_name)").eq("role", "trainer").eq("active", true).order("staff_code"),
      supabase.from("staff").select("staff_code").order("staff_code")
    ]);

    members = (memberRows as MemberOption[] | null) ?? [];
    packages = (packageRows as PackageOption[] | null) ?? [];
    trainers = (trainerRows as TrainerOption[] | null) ?? [];
    staffCodeRows = (allStaffRows as StaffCodeOption[] | null) ?? [];
  }

  const statusMessage = getStatusMessage(searchParams?.status);
  const errorMessage = getErrorMessage(searchParams?.error, searchParams?.detail);
  const nextMemberCode = isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? await peekGeneratedCode(createAdminClient(), "peek_member_code", getNextSequentialCode(members.map((member) => member.member_code ?? ""), "LUXE-", 1001))
    : getNextSequentialCode(members.map((member) => member.member_code ?? ""), "LUXE-", 1001);
  const nextTrainerCode = isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? await peekGeneratedCode(createAdminClient(), "peek_trainer_code", getNextSequentialCode(staffCodeRows.map((staff) => staff.staff_code ?? ""), "LUXE-TR-", 1))
    : getNextSequentialCode(staffCodeRows.map((staff) => staff.staff_code ?? ""), "LUXE-TR-", 1);

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "white", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .admin-manage-shell { max-width: 1320px; margin: 0 auto; padding: 2rem; }
            .admin-manage-hero { display: grid; grid-template-columns: 1.5fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
            .admin-manage-hero > * { min-width: 0; }
            .admin-manage-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.5rem; }
            .admin-manage-grid > * { min-width: 0; }
            .admin-manage-grid input,
            .admin-manage-grid select,
            .admin-manage-grid textarea,
            .admin-manage-grid button { width: 100%; max-width: 100%; }
            @media (max-width: 980px) {
              .admin-manage-shell { padding: 1.25rem; }
              .admin-manage-hero { grid-template-columns: 1fr; }
              .admin-manage-grid { grid-template-columns: 1fr; }
            }
          `
        }}
      />
      <div className="admin-manage-shell">
        {statusMessage ? <AutoDismissToast message={statusMessage} tone="success" /> : null}
        {errorMessage ? <AutoDismissToast message={errorMessage} tone="error" /> : null}
        <ManageFormDraftController hasSuccessState={Boolean(statusMessage)} hasErrorState={Boolean(errorMessage)} />

        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <Link href="/admin" style={{ color: "white", textDecoration: "none", fontWeight: 800 }}>
            ← Back to Admin Dashboard
          </Link>
          <Link href="/" style={{ color: "#9a9a9a", textDecoration: "none", fontWeight: 700 }}>
            Luxe Home
          </Link>
        </div>
        <section className="admin-manage-hero">
          <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "1.6rem", background: "linear-gradient(180deg, rgba(18,18,18,0.98), rgba(11,11,11,0.98))" }}>
            <div style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "#ff5a5a", fontWeight: 900, marginBottom: "0.8rem" }}>
              Admin Control
            </div>
            <h1 style={{ margin: 0, fontSize: "clamp(2rem, 4vw, 3.2rem)", lineHeight: 0.95 }}>Manage people, packages, and payments.</h1>
            <p style={{ color: "#9a9a9a", lineHeight: 1.65, maxWidth: 720 }}>
              Add members and trainers, load their photos into secure gym records, define training packages, and track payments from one place.
            </p>
          </div>
          <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "1.6rem", background: "#111" }}>
            <div style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "#ff5a5a", fontWeight: 900, marginBottom: "0.8rem" }}>
              Snapshot
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" }}>
              <div style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1rem" }}>
                <div style={{ color: "#9a9a9a" }}>Members</div>
                <strong style={{ fontSize: "1.5rem" }}>{members.length}</strong>
              </div>
              <div style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1rem" }}>
                <div style={{ color: "#9a9a9a" }}>Packages</div>
                <strong style={{ fontSize: "1.5rem" }}>{packages.length}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="admin-manage-grid">
          <article style={panelStyle}>
            <SectionTitle eyebrow="New Member" title="Add Gym Member" description="Create the member profile and first membership in one step." />
            <form id="member-form" data-draft-key="admin-manage-member-form" action={createMemberAction} style={formStyle}>
              <FieldLabel label="Full name">
                <input name="fullName" placeholder="Full name" required style={inputStyle} />
              </FieldLabel>
              <FieldLabel label="Luxe ID">
                <input name="memberCode" defaultValue={nextMemberCode} placeholder="Luxe ID" required style={inputStyle} />
              </FieldLabel>
              <FieldLabel label="Phone">
                <input name="phone" placeholder="Phone" required style={inputStyle} />
              </FieldLabel>
              <FieldLabel label="Email">
                <input name="email" placeholder="Email" type="email" style={inputStyle} />
              </FieldLabel>
              <label style={labelStyle}>
                Member photo
                <input name="photo" type="file" accept="image/png,image/jpeg,image/webp" style={inputStyle} />
              </label>
              <FieldLabel label="Personal trainer">
                <select name="personalTrainerId" defaultValue="" style={inputStyle}>
                  <option value="">No Personal Trainer</option>
                  {trainers.map((trainer) => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.staff_code} - {trainer.profiles?.full_name ?? "Trainer"}
                    </option>
                  ))}
                </select>
              </FieldLabel>
              <MemberPackageSelector packages={packages.filter((pkg) => pkg.active)} />
              <FieldLabel label="Membership status">
                <select name="membershipStatus" defaultValue="active" style={inputStyle}>
                  <option value="active">Active</option>
                  <option value="expiring">Expiring</option>
                  <option value="expired">Expired</option>
                  <option value="due">Due</option>
                </select>
              </FieldLabel>
              <FieldLabel label="Start date">
                <input name="startDate" type="date" required style={inputStyle} />
              </FieldLabel>
              <button type="submit" style={buttonStyle}>Create Member</button>
            </form>
            <p style={helpTextStyle}>Upload a clear face photo up to 2MB. Photos are stored in a private bucket and shown during check-in, trainer lookup, and gym records.</p>
            {!packages.filter((pkg) => pkg.active).length ? (
              <div style={{ marginTop: "0.9rem", color: "#fcd34d", fontWeight: 700 }}>
                Add at least one active package before creating a member.
              </div>
            ) : null}
          </article>

          <article style={panelStyle}>
            <SectionTitle eyebrow="New Trainer" title="Add Gym Trainer" description="Register a trainer or admin staff profile for the floor." />
            <form id="trainer-form" data-draft-key="admin-manage-trainer-form" action={createTrainerAction} style={formStyle}>
              <FieldLabel label="Full name">
                <input name="fullName" placeholder="Full name" required style={inputStyle} />
              </FieldLabel>
              <FieldLabel label="Luxe ID">
                <input name="staffCode" defaultValue={nextTrainerCode} placeholder="Trainer Luxe ID" required style={inputStyle} />
              </FieldLabel>
              <FieldLabel label="Phone">
                <input name="phone" placeholder="Phone" required style={inputStyle} />
              </FieldLabel>
              <FieldLabel label="Email">
                <input name="email" placeholder="Email" type="email" style={inputStyle} />
              </FieldLabel>
              <label style={labelStyle}>
                Trainer photo
                <input name="photo" type="file" accept="image/png,image/jpeg,image/webp" style={inputStyle} />
              </label>
              <FieldLabel label="Specialization">
                <input name="specialization" placeholder="Specialization" style={inputStyle} />
              </FieldLabel>
              <FieldLabel label="Role">
                <select name="role" defaultValue="trainer" style={inputStyle}>
                  <option value="trainer">Trainer</option>
                  <option value="admin">Admin</option>
                </select>
              </FieldLabel>
              <button type="submit" style={buttonStyle}>Create Trainer</button>
            </form>
            <p style={helpTextStyle}>Trainer photos appear in the coaches view, the trainer workspace, and staff records.</p>
          </article>

          <article style={panelStyle}>
            <SectionTitle eyebrow="New Package" title="Add Gym Package" description="Store reusable packages with price and duration." />
            <form id="package-form" data-draft-key="admin-manage-package-form" action={createMembershipPackageAction} style={formStyle}>
              <FieldLabel label="Package name">
                <input name="name" placeholder="Package name" required style={inputStyle} />
              </FieldLabel>
              <FieldLabel label="Duration in days">
                <input name="durationDays" type="number" min="1" placeholder="Duration in days" required style={inputStyle} />
              </FieldLabel>
              <FieldLabel label="Package price">
                <input name="price" type="number" step="0.01" min="0" placeholder="Package price" required style={inputStyle} />
              </FieldLabel>
              <FieldLabel label="Status">
                <select name="active" defaultValue="true" style={inputStyle}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </FieldLabel>
              <FieldLabel label="Description">
                <textarea name="description" placeholder="Description" style={{ ...inputStyle, minHeight: 120, resize: "vertical" }} />
              </FieldLabel>
              <button type="submit" style={buttonStyle}>Save Package</button>
            </form>
            {packages.length ? (
              <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
                {packages.slice(0, 5).map((pkg) => (
                  <div key={pkg.id} style={listItemStyle}>
                    <div>
                      <strong>{pkg.name}</strong>
                      <div style={{ color: "#9a9a9a", marginTop: 4 }}>{pkg.duration_days} days • Rs {Number(pkg.price).toFixed(2)}</div>
                    </div>
                    <span style={{ ...pillStyle, background: pkg.active ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)", color: pkg.active ? "#a7f3d0" : "#fcd34d" }}>
                      {pkg.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </article>

          <article style={panelStyle}>
            <SectionTitle eyebrow="Payment Entry" title="Record Payment" description="Log payments received and optionally reduce the outstanding due." />
            <form id="payment-form" data-draft-key="admin-manage-payment-form" action={recordMemberPaymentAction} style={formStyle}>
              <FieldLabel label="Member">
                <select name="memberId" required defaultValue="" style={inputStyle}>
                  <option value="" disabled>Select member</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.member_code} - {member.profiles?.full_name ?? "Member"}
                    </option>
                  ))}
                </select>
              </FieldLabel>
              <FieldLabel label="Amount received">
                <input name="amount" type="number" step="0.01" min="0" placeholder="Amount received" required style={inputStyle} />
              </FieldLabel>
              <FieldLabel label="Payment method">
                <select name="method" defaultValue="cash" style={inputStyle}>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="bank-transfer">Bank Transfer</option>
                </select>
              </FieldLabel>
              <FieldLabel label="Paid on">
                <input name="paidOn" type="date" required style={inputStyle} />
              </FieldLabel>
              <FieldLabel label="Reduce due by">
                <input name="dueReduction" type="number" step="0.01" min="0" defaultValue="0" placeholder="Reduce due by" style={inputStyle} />
              </FieldLabel>
              <FieldLabel label="Notes">
                <textarea name="notes" placeholder="Notes" style={{ ...inputStyle, minHeight: 120, resize: "vertical" }} />
              </FieldLabel>
              <button type="submit" style={buttonStyle}>Record Payment</button>
            </form>
            {!members.length ? (
              <div style={{ marginTop: "0.9rem", color: "#fcd34d", fontWeight: 700 }}>
                Add a member first before recording a payment.
              </div>
            ) : null}
          </article>
        </section>
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "#ff5a5a", fontWeight: 900, marginBottom: "0.55rem" }}>
        {eyebrow}
      </div>
      <h2 style={{ margin: 0, fontSize: "1.35rem" }}>{title}</h2>
      <p style={{ color: "#9a9a9a", marginBottom: 0, lineHeight: 1.6 }}>{description}</p>
    </div>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={labelStyle}>{label}{children}</label>;
}

const panelStyle: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 22,
  padding: "1.4rem",
  background: "#111",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden"
};

const formStyle: CSSProperties = {
  display: "grid",
  gap: "0.85rem"
};

const inputStyle: CSSProperties = {
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "#090909",
  color: "white",
  padding: "0.92rem 1rem"
};

const readOnlyInputStyle: CSSProperties = {
  ...inputStyle,
  color: "#d4d4d4",
  background: "#101010"
};

const labelStyle: CSSProperties = {
  display: "grid",
  gap: "0.45rem",
  color: "#cfcfcf",
  fontSize: 13,
  fontWeight: 700
};

const helpTextStyle: CSSProperties = {
  marginTop: "0.85rem",
  color: "#9a9a9a",
  lineHeight: 1.6,
  fontSize: 13
};

const buttonStyle: CSSProperties = {
  border: "none",
  borderRadius: 14,
  background: "linear-gradient(135deg, #ff4d4d 0%, #d92020 100%)",
  color: "white",
  padding: "1rem 1.1rem",
  fontWeight: 900,
  letterSpacing: "0.08em",
  cursor: "pointer"
};

const listItemStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1rem",
  background: "#171717",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 14,
  padding: "0.95rem 1rem"
};

const pillStyle: CSSProperties = {
  borderRadius: 999,
  padding: "0.35rem 0.7rem",
  fontSize: 12,
  fontWeight: 800,
  textTransform: "uppercase"
};

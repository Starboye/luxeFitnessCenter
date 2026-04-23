import type { CSSProperties } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import {
  createMemberAction,
  createMembershipPackageAction,
  createTrainerAction,
  recordMemberPaymentAction
} from "@/app/actions";
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

export default async function AdminManagePage({ searchParams }: ManagePageProps) {
  let members: MemberOption[] = [];
  let packages: PackageOption[] = [];

  if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createAdminClient();
    const [{ data: memberRows }, { data: packageRows }] = await Promise.all([
      supabase.from("members").select("id, member_code, profiles(full_name)").order("member_code"),
      supabase.from("membership_packages").select("id, name, duration_days, price, active").order("created_at", { ascending: false })
    ]);

    members = (memberRows as MemberOption[] | null) ?? [];
    packages = (packageRows as PackageOption[] | null) ?? [];
  }

  const statusMessage = getStatusMessage(searchParams?.status);
  const errorMessage = getErrorMessage(searchParams?.error, searchParams?.detail);

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "white", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <Link href="/admin" style={{ color: "white", textDecoration: "none", fontWeight: 800 }}>
            ← Back to Admin Dashboard
          </Link>
          <Link href="/" style={{ color: "#9a9a9a", textDecoration: "none", fontWeight: 700 }}>
            Luxe Home
          </Link>
        </div>

        {statusMessage ? (
          <div style={{ marginBottom: "1rem", padding: "1rem", borderRadius: 14, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#b7f7de", fontWeight: 800 }}>
            {statusMessage}
          </div>
        ) : null}
        {errorMessage ? (
          <div style={{ marginBottom: "1rem", padding: "1rem", borderRadius: 14, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#ffc4c4", fontWeight: 800 }}>
            {errorMessage}
          </div>
        ) : null}

        <section style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
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

        <section style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "1.5rem" }}>
          <article style={panelStyle}>
            <SectionTitle eyebrow="New Member" title="Add Gym Member" description="Create the member profile and first membership in one step." />
            <form action={createMemberAction} style={formStyle}>
              <input name="fullName" placeholder="Full name" required style={inputStyle} />
              <input name="memberCode" placeholder="Luxe ID (LUXE-1005)" required style={inputStyle} />
              <input name="phone" placeholder="Phone" required style={inputStyle} />
              <input name="email" placeholder="Email" type="email" style={inputStyle} />
              <label style={labelStyle}>
                Member photo
                <input name="photo" type="file" accept="image/png,image/jpeg,image/webp" style={inputStyle} />
              </label>
              <select name="packageId" required defaultValue="" style={inputStyle}>
                <option value="" disabled>Select gym package</option>
                {packages.filter((pkg) => pkg.active).map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} - {pkg.duration_days} days - Rs {Number(pkg.price).toFixed(2)}
                  </option>
                ))}
              </select>
              <select name="membershipStatus" defaultValue="active" style={inputStyle}>
                <option value="active">Active</option>
                <option value="expiring">Expiring</option>
                <option value="expired">Expired</option>
                <option value="due">Due</option>
              </select>
              <input name="startDate" type="date" required style={inputStyle} />
              <input name="dueAmount" type="number" step="0.01" min="0" defaultValue="0" placeholder="Due amount" required style={inputStyle} />
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
            <form action={createTrainerAction} style={formStyle}>
              <input name="fullName" placeholder="Full name" required style={inputStyle} />
              <input name="staffCode" placeholder="Trainer Luxe ID (LUXE-TR-001)" required style={inputStyle} />
              <input name="phone" placeholder="Phone" required style={inputStyle} />
              <input name="email" placeholder="Email" type="email" style={inputStyle} />
              <label style={labelStyle}>
                Trainer photo
                <input name="photo" type="file" accept="image/png,image/jpeg,image/webp" style={inputStyle} />
              </label>
              <input name="specialization" placeholder="Specialization" style={inputStyle} />
              <select name="role" defaultValue="trainer" style={inputStyle}>
                <option value="trainer">Trainer</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit" style={buttonStyle}>Create Trainer</button>
            </form>
            <p style={helpTextStyle}>Trainer photos appear in the coaches view, the trainer workspace, and staff records.</p>
          </article>

          <article style={panelStyle}>
            <SectionTitle eyebrow="New Package" title="Add Gym Package" description="Store reusable packages with price and duration." />
            <form action={createMembershipPackageAction} style={formStyle}>
              <input name="name" placeholder="Package name" required style={inputStyle} />
              <input name="durationDays" type="number" min="1" placeholder="Duration in days" required style={inputStyle} />
              <input name="price" type="number" step="0.01" min="0" placeholder="Package price" required style={inputStyle} />
              <select name="active" defaultValue="true" style={inputStyle}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <textarea name="description" placeholder="Description" style={{ ...inputStyle, minHeight: 120, resize: "vertical" }} />
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
            <form action={recordMemberPaymentAction} style={formStyle}>
              <select name="memberId" required defaultValue="" style={inputStyle}>
                <option value="" disabled>Select member</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.member_code} - {member.profiles?.full_name ?? "Member"}
                  </option>
                ))}
              </select>
              <input name="amount" type="number" step="0.01" min="0" placeholder="Amount received" required style={inputStyle} />
              <select name="method" defaultValue="cash" style={inputStyle}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="bank-transfer">Bank Transfer</option>
              </select>
              <input name="paidOn" type="date" required style={inputStyle} />
              <input name="dueReduction" type="number" step="0.01" min="0" defaultValue="0" placeholder="Reduce due by" style={inputStyle} />
              <textarea name="notes" placeholder="Notes" style={{ ...inputStyle, minHeight: 120, resize: "vertical" }} />
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

const panelStyle: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 22,
  padding: "1.4rem",
  background: "#111"
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

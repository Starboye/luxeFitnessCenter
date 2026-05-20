import type { CSSProperties } from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { createMemberAction } from "@/app/actions";
import { AutoDismissToast } from "@/components/auto-dismiss-toast";
import { ManageFormDraftController } from "@/components/manage-form-draft-controller";
import { MemberPackageSelector } from "@/components/member-package-selector";
import { isSupabaseConfigured } from "@/lib/supabase-server";

type TrainerManagePageProps = {
  searchParams?: {
    status?: string;
    error?: string;
    detail?: string;
  };
};

type MemberOption = {
  id: string;
  member_code: string;
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

function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function getStatusMessage(status?: string) {
  switch (status) {
    case "member-created":
      return "New gym member created successfully.";
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
    case "member-code-exists":
      return "That member Luxe ID already exists.";
    case "profile-contact-exists":
      return "That phone number or email is already in use.";
    case "package-not-found":
      return "Please select a valid active gym package.";
    case "database-error":
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
  rpcName: "peek_member_code",
  fallbackCode: string
) {
  const { data, error } = await supabase.rpc(rpcName);
  if (error || typeof data !== "string" || !data.trim()) {
    return fallbackCode;
  }

  return data.trim().toUpperCase();
}

export default async function TrainerManagePage({ searchParams }: TrainerManagePageProps) {
  const trainerSession = cookies().get("luxe_trainer_session")?.value;

  if (!trainerSession) {
    redirect("/trainer-access");
  }

  let members: MemberOption[] = [];
  let packages: PackageOption[] = [];
  let trainers: TrainerOption[] = [];

  if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createAdminClient();
    const [{ data: memberRows }, { data: packageRows }, { data: trainerRows }] = await Promise.all([
      supabase.from("members").select("id, member_code").order("member_code"),
      supabase.from("membership_packages").select("id, name, duration_days, price, active").order("created_at", { ascending: false }),
      supabase.from("staff").select("id, staff_code, profiles(full_name)").eq("role", "trainer").eq("active", true).order("staff_code")
    ]);

    members = (memberRows as MemberOption[] | null) ?? [];
    packages = (packageRows as PackageOption[] | null) ?? [];
    trainers = (trainerRows as TrainerOption[] | null) ?? [];
  }

  const statusMessage = getStatusMessage(searchParams?.status);
  const errorMessage = getErrorMessage(searchParams?.error, searchParams?.detail);
  const nextMemberCode = isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? await peekGeneratedCode(createAdminClient(), "peek_member_code", getNextSequentialCode(members.map((member) => member.member_code ?? ""), "LUXE-", 1001))
    : getNextSequentialCode(members.map((member) => member.member_code ?? ""), "LUXE-", 1001);

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "white", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .trainer-manage-shell { max-width: 920px; margin: 0 auto; padding: 2rem; }
            @media (max-width: 980px) { .trainer-manage-shell { padding: 1.25rem; } }
          `
        }}
      />
      <div className="trainer-manage-shell">
        {statusMessage ? <AutoDismissToast message={statusMessage} tone="success" /> : null}
        {errorMessage ? <AutoDismissToast message={errorMessage} tone="error" /> : null}
        <ManageFormDraftController hasSuccessState={Boolean(statusMessage)} hasErrorState={Boolean(errorMessage)} />

        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <Link href="/trainer" style={{ color: "white", textDecoration: "none", fontWeight: 800 }}>
            Back to Trainer Workspace
          </Link>
          <Link href="/" style={{ color: "#9a9a9a", textDecoration: "none", fontWeight: 700 }}>
            Luxe Home
          </Link>
        </div>

        <section style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "1.6rem", background: "linear-gradient(180deg, rgba(18,18,18,0.98), rgba(11,11,11,0.98))", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "#ff5a5a", fontWeight: 900, marginBottom: "0.8rem" }}>
            Trainer Access
          </div>
          <h1 style={{ margin: 0, fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 0.95 }}>Add Gym Member</h1>
          <p style={{ color: "#9a9a9a", lineHeight: 1.65, maxWidth: 720 }}>
            Trainers can register new members here without access to admin-only package, payment, or staff controls.
          </p>
        </section>

        <article style={panelStyle}>
          <SectionTitle eyebrow="New Member" title="Register Member" description="Create the member profile and first membership from the trainer workspace." />
          <form id="member-form" data-draft-key="trainer-manage-member-form" action={createMemberAction} style={formStyle}>
            <input type="hidden" name="redirectBase" value="/trainer/manage" />
            <FieldLabel label="Full name">
              <input name="fullName" placeholder="Full name" required style={inputStyle} />
            </FieldLabel>
            <FieldLabel label="Luxe ID">
              <input name="memberCode" defaultValue={nextMemberCode} placeholder="Luxe ID" required readOnly style={readOnlyInputStyle} />
            </FieldLabel>
            <FieldLabel label="Phone">
              <input name="phone" placeholder="Phone" required style={inputStyle} />
            </FieldLabel>
            <FieldLabel label="Email">
              <input name="email" placeholder="Email" type="email" style={inputStyle} />
            </FieldLabel>
            <FieldLabel label="Member photo">
              <input name="photo" type="file" accept="image/png,image/jpeg,image/webp" style={inputStyle} />
            </FieldLabel>
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
        </article>
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

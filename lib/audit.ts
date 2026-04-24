import { createClient } from "@supabase/supabase-js";

type AuditActorRole = "admin" | "trainer" | "member" | "system" | "unknown";
type AuditStatus = "success" | "error" | "blocked";
type AuditTargetType = "member" | "trainer" | "admin" | "payment" | "package" | "system";

export type AuditEntry = {
  actorRole: AuditActorRole;
  actorCode?: string | null;
  actionCode: string;
  status?: AuditStatus;
  targetType?: AuditTargetType | null;
  targetCode?: string | null;
  amount?: number | null;
  context?: string | null;
  detail?: string | null;
  meta?: Record<string, string | number | boolean | null | undefined> | null;
};

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function trimValue(value?: string | null, maxLength = 160) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function sanitizeMeta(meta?: AuditEntry["meta"]) {
  if (!meta) {
    return null;
  }

  const entries = Object.entries(meta)
    .filter(([, value]) => value !== undefined)
    .slice(0, 8)
    .map(([key, value]) => [key, typeof value === "string" ? trimValue(value, 80) : value]);

  return entries.length ? Object.fromEntries(entries) : null;
}

export async function logAuditEvent(entry: AuditEntry) {
  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return;
    }

    await supabase.from("ui_activity_logs").insert({
      actor_role: entry.actorRole,
      actor_code: trimValue(entry.actorCode, 40),
      action_code: trimValue(entry.actionCode, 60),
      status: entry.status ?? "success",
      target_type: entry.targetType ?? null,
      target_code: trimValue(entry.targetCode, 40),
      amount: typeof entry.amount === "number" ? entry.amount : null,
      context: trimValue(entry.context, 80),
      detail: trimValue(entry.detail, 160),
      meta: sanitizeMeta(entry.meta)
    });
  } catch (error) {
    console.error("AUDIT_LOG_ERROR", error);
  }
}

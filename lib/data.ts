// import { revalidatePath } from "next/cache";
// import { createClient } from "@supabase/supabase-js";
// import {
//   AdminDashboardData,
//   AlertItem,
//   AttendanceEvent,
//   DashboardStats,
//   KioskCheckInResponse,
//   Member,
//   Membership,
//   Payment,
//   Staff,
//   TrainerDashboardData
// } from "@/lib/types";
// import { mockAdminDashboardData, mockMembers, mockTrainerDashboardData } from "@/lib/mock-data";
// import { isSupabaseConfigured } from "@/lib/supabase-server";

// const ATTENDANCE_TARGET = 20;

// type ProfileRow = {
//   id: string;
//   full_name: string;
//   email: string | null;
//   phone: string | null;
// };

// type MemberRow = {
//   id: string;
//   profile_id: string | null;
//   member_code: string;
//   active: boolean;
//   joined_at: string;
// };

// type StaffRow = {
//   id: string;
//   profile_id: string | null;
//   role: "admin" | "trainer";
//   specialization: string | null;
//   active: boolean;
// };

// type MembershipRow = {
//   id: string;
//   member_id: string;
//   plan_name: string;
//   start_date: string;
//   end_date: string;
//   total_fee: number | string;
//   due_amount: number | string;
//   status: "active" | "expiring" | "expired" | "due";
// };

// type PaymentRow = {
//   id: string;
//   member_id: string;
//   amount: number | string;
//   method: "cash" | "upi" | "card" | "bank-transfer";
//   paid_on: string;
//   notes: string | null;
//   received_by: string | null;
// };

// type AlertRow = {
//   id: string;
//   member_id: string | null;
//   title: string;
//   description: string;
//   severity: "info" | "warning" | "critical";
//   due_on: string | null;
// };

// type AttendanceEventRow = {
//   id: string;
//   actor_id: string;
//   actor_type: "member" | "trainer";
//   source: "kiosk" | "qr" | "trainer-login" | "trainer-logout";
//   result: "success" | "duplicate" | "invalid" | "blocked";
//   occurred_at: string;
//   note: string | null;
// };

// type DailyAttendanceRow = {
//   actor_id: string;
//   actor_type: "member" | "trainer";
//   attendance_date: string;
// };

// function sameDay(left: string, right: string) {
//   const l = new Date(left);
//   const r = new Date(right);
//   return l.getUTCFullYear() === r.getUTCFullYear() && l.getUTCMonth() === r.getUTCMonth() && l.getUTCDate() === r.getUTCDate();
// }

// function toNumber(value: number | string | null | undefined) {
//   if (typeof value === "number") {
//     return value;
//   }

//   if (typeof value === "string") {
//     const parsed = Number(value);
//     return Number.isFinite(parsed) ? parsed : 0;
//   }

//   return 0;
// }

// function toMembership(row: MembershipRow): Membership {
//   return {
//     id: row.id,
//     memberId: row.member_id,
//     planName: row.plan_name,
//     startDate: row.start_date,
//     endDate: row.end_date,
//     totalFee: toNumber(row.total_fee),
//     dueAmount: toNumber(row.due_amount),
//     status: row.status
//   };
// }

// function toPayment(row: PaymentRow): Payment {
//   return {
//     id: row.id,
//     memberId: row.member_id,
//     amount: toNumber(row.amount),
//     method: row.method,
//     paidOn: row.paid_on,
//     notes: row.notes ?? undefined,
//     receivedBy: row.received_by ?? "unknown"
//   };
// }

// function toAlert(row: AlertRow): AlertItem {
//   return {
//     id: row.id,
//     memberId: row.member_id ?? undefined,
//     title: row.title,
//     description: row.description,
//     severity: row.severity,
//     dueOn: row.due_on ?? undefined
//   };
// }

// function toAttendanceEvent(row: AttendanceEventRow): AttendanceEvent {
//   return {
//     id: row.id,
//     actorId: row.actor_id,
//     actorType: row.actor_type,
//     source: row.source,
//     result: row.result,
//     occurredAt: row.occurred_at,
//     note: row.note ?? undefined
//   };
// }

// function getLatestMembership(memberships: Membership[]) {
//   return [...memberships].sort((left, right) => new Date(right.endDate).getTime() - new Date(left.endDate).getTime())[0];
// }

// function buildMembers(
//   members: MemberRow[],
//   profiles: ProfileRow[],
//   memberships: Membership[],
//   events: AttendanceEvent[]
// ) {
//   const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
//   const membershipsByMember = new Map<string, Membership[]>();
//   const eventsByMember = new Map<string, AttendanceEvent[]>();

//   memberships.forEach((membership) => {
//     const existing = membershipsByMember.get(membership.memberId) ?? [];
//     existing.push(membership);
//     membershipsByMember.set(membership.memberId, existing);
//   });

//   events
//     .filter((event) => event.actorType === "member")
//     .forEach((event) => {
//       const existing = eventsByMember.get(event.actorId) ?? [];
//       existing.push(event);
//       eventsByMember.set(event.actorId, existing);
//     });

//   return members.map((member) => {
//     const profile = member.profile_id ? profileMap.get(member.profile_id) : undefined;
//     const relatedMemberships = membershipsByMember.get(member.id) ?? [];
//     const latestMembership = getLatestMembership(relatedMemberships);
//     const memberEvents = (eventsByMember.get(member.id) ?? []).sort(
//       (left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
//     );
//     const successfulEvents = memberEvents.filter((event) => event.result === "success");
//     const activeMembership = relatedMemberships.find((membership) => membership.status === "active" || membership.status === "expiring");
//     const plan = activeMembership ?? latestMembership;
//     const daysLeft = plan ? Math.max(0, Math.ceil((new Date(plan.endDate).getTime() - Date.now()) / 86400000)) : 0;
//     let streak = 0;

//     for (let index = 0; index < successfulEvents.length; index += 1) {
//       const currentDate = new Date(successfulEvents[index].occurredAt);
//       if (index === 0) {
//         streak = 1;
//         continue;
//       }

//       const previousDate = new Date(successfulEvents[index - 1].occurredAt);
//       const difference = Math.round((previousDate.getTime() - currentDate.getTime()) / 86400000);
//       if (difference === 1) {
//         streak += 1;
//       } else if (difference > 1) {
//         break;
//       }
//     }

//     return {
//       id: member.id,
//       memberCode: member.member_code,
//       fullName: profile?.full_name ?? "Member",
//       phone: profile?.phone ?? undefined,
//       active: member.active,
//       joinedAt: member.joined_at,
//       currentPlan: plan?.planName ?? "No active plan",
//       daysLeft,
//       dueAmount: plan?.dueAmount ?? 0,
//       streak,
//       attendanceProgress: {
//         attended: successfulEvents.length,
//         target: ATTENDANCE_TARGET
//       },
//       lastCheckIn: successfulEvents[0]?.occurredAt
//     } satisfies Member;
//   });
// }

// function buildStaff(staffRows: StaffRow[], profiles: ProfileRow[], events: AttendanceEvent[]) {
//   const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
//   const today = new Date().toISOString();

//   return staffRows.map((staff) => {
//     const profile = staff.profile_id ? profileMap.get(staff.profile_id) : undefined;
//     const todaysEvents = events
//       .filter((event) => event.actorType === "trainer" && event.actorId === staff.id && sameDay(event.occurredAt, today))
//       .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime());
//     const latestToday = todaysEvents[0];
//     const todayStatus = latestToday
//       ? latestToday.source === "trainer-logout"
//         ? "checked-out"
//         : "checked-in"
//       : "offline";

//     return {
//       id: staff.id,
//       fullName: profile?.full_name ?? "Staff",
//       email: profile?.email ?? undefined,
//       role: staff.role,
//       active: staff.active,
//       specialization: staff.specialization ?? undefined,
//       todayStatus
//     } satisfies Staff;
//   });
// }

// function buildStats(
//   members: Member[],
//   trainers: Staff[],
//   memberships: Membership[],
//   payments: Payment[],
//   dailyAttendance: DailyAttendanceRow[]
// ): DashboardStats {
//   const currentMonth = new Date();
//   const monthlyPayments = payments.filter((payment) => {
//     const paidOn = new Date(payment.paidOn);
//     return paidOn.getUTCFullYear() === currentMonth.getUTCFullYear() && paidOn.getUTCMonth() === currentMonth.getUTCMonth();
//   });

//   const outstandingDues = memberships.reduce((sum, membership) => sum + membership.dueAmount, 0);
//   const collectionsThisMonth = monthlyPayments.reduce((sum, payment) => sum + payment.amount, 0);
//   const todaysDate = new Date().toISOString().slice(0, 10);
//   const memberAttendanceToday = new Set(
//     dailyAttendance.filter((row) => row.actor_type === "member" && row.attendance_date === todaysDate).map((row) => row.actor_id)
//   ).size;
//   const trainerAttendanceToday = new Set(
//     dailyAttendance.filter((row) => row.actor_type === "trainer" && row.attendance_date === todaysDate).map((row) => row.actor_id)
//   ).size;

//   return {
//     totalMembers: members.length,
//     activeMembers: members.filter((member) => member.active).length,
//     activeTrainers: trainers.filter((trainer) => trainer.active).length,
//     collectionsThisMonth,
//     outstandingDues,
//     profitEstimate: Math.max(collectionsThisMonth - outstandingDues, 0),
//     memberAttendanceToday,
//     trainerAttendanceToday
//   };
// }

// function createAdminClient() {
//   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
//   const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

//   if (!supabaseUrl || !serviceRoleKey) {
//     throw new Error("Supabase admin credentials are missing.");
//   }

//   return createClient(supabaseUrl, serviceRoleKey, {
//     auth: {
//       persistSession: false,
//       autoRefreshToken: false
//     }
//   });
// }

// async function fetchLiveData() {
//   const supabase = createAdminClient();
//   const [{ data: profiles }, { data: memberRows }, { data: staffRows }, { data: membershipRows }, { data: paymentRows }, { data: alertRows }, { data: eventRows }, { data: dailyAttendance }] =
//     await Promise.all([
//       supabase.from("profiles").select("*"),
//       supabase.from("members").select("*").order("joined_at", { ascending: false }),
//       supabase.from("staff").select("*").order("role").order("id"),
//       supabase.from("memberships").select("*").order("end_date", { ascending: false }),
//       supabase.from("payments").select("*").order("paid_on", { ascending: false }),
//       supabase.from("alert_queue").select("*").order("due_on", { ascending: true }),
//       supabase.from("attendance_events").select("*").order("occurred_at", { ascending: false }).limit(100),
//       supabase.from("daily_attendance").select("actor_id, actor_type, attendance_date")
//     ]);

//   const memberships = (membershipRows as MembershipRow[] | null)?.map(toMembership) ?? [];
//   const payments = (paymentRows as PaymentRow[] | null)?.map(toPayment) ?? [];
//   const attendanceEvents = (eventRows as AttendanceEventRow[] | null)?.map(toAttendanceEvent) ?? [];
//   const members = buildMembers((memberRows as MemberRow[] | null) ?? [], (profiles as ProfileRow[] | null) ?? [], memberships, attendanceEvents);
//   const staff = buildStaff((staffRows as StaffRow[] | null) ?? [], (profiles as ProfileRow[] | null) ?? [], attendanceEvents);
//   const alerts = (alertRows as AlertRow[] | null)?.map(toAlert) ?? [];

//   return {
//     members,
//     trainers: staff.filter((person) => person.role === "trainer"),
//     memberships,
//     payments,
//     alerts,
//     attendanceEvents,
//     dailyAttendance: (dailyAttendance as DailyAttendanceRow[] | null) ?? []
//   };
// }

// export async function getAdminDashboardData(): Promise<AdminDashboardData> {
//   if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
//     return mockAdminDashboardData;
//   }

//   const liveData = await fetchLiveData();

//   return {
//     stats: buildStats(liveData.members, liveData.trainers, liveData.memberships, liveData.payments, liveData.dailyAttendance),
//     members: liveData.members,
//     trainers: liveData.trainers,
//     memberships: liveData.memberships,
//     payments: liveData.payments,
//     alerts: liveData.alerts,
//     attendanceEvents: liveData.attendanceEvents.slice(0, 20)
//   };
// }

// export async function getTrainerDashboardData(): Promise<TrainerDashboardData> {
//   if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
//     return mockTrainerDashboardData;
//   }

//   const liveData = await fetchLiveData();

//   return {
//     trainer: liveData.trainers[0] ?? mockTrainerDashboardData.trainer,
//     visibleMembers: liveData.members.filter((member) => member.active),
//     recentEvents: liveData.attendanceEvents.filter((event) => event.actorType === "member").slice(0, 8)
//   };
// }

// export async function findMemberByCode(memberCode: string) {
//   if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
//     return mockMembers.find((member) => member.memberCode.toLowerCase() === memberCode.toLowerCase()) ?? null;
//   }

//   const liveData = await fetchLiveData();
//   return liveData.members.find((member) => member.memberCode.toLowerCase() === memberCode.toLowerCase()) ?? null;
// }

// function buildKioskResponse(member: Member | null, source: "kiosk" | "qr", duplicateToday: boolean): KioskCheckInResponse {
//   if (!member) {
//     return {
//       ok: false,
//       message: "We couldn't find an active membership with that ID.",
//       latestEvent: {
//         id: crypto.randomUUID(),
//         actorId: "unknown",
//         actorType: "member",
//         source,
//         result: "invalid",
//         occurredAt: new Date().toISOString(),
//         note: "Unknown member code"
//       }
//     };
//   }

//   if (!member.active) {
//     return {
//       ok: false,
//       message: "This membership is inactive. Please meet the front desk for help.",
//       member,
//       latestEvent: {
//         id: crypto.randomUUID(),
//         actorId: member.id,
//         actorType: "member",
//         source,
//         result: "blocked",
//         occurredAt: new Date().toISOString(),
//         note: "Inactive member"
//       }
//     };
//   }

//   const result: AttendanceEvent = {
//     id: crypto.randomUUID(),
//     actorId: member.id,
//     actorType: "member",
//     source,
//     result: duplicateToday ? "duplicate" : "success",
//     occurredAt: new Date().toISOString(),
//     note: duplicateToday ? "Already counted for today" : "Attendance marked"
//   };

//   return {
//     ok: true,
//     message: duplicateToday ? "Attendance already counted today. This scan has still been logged." : "Attendance marked successfully.",
//     member,
//     latestEvent: result
//   };
// }

// export async function markMemberAttendance(memberCode: string, source: "kiosk" | "qr") {
//   const member = await findMemberByCode(memberCode);
//   let duplicateToday = false;

//   if (member && isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
//     const supabase = createAdminClient();
//     const todayStart = new Date();
//     todayStart.setUTCHours(0, 0, 0, 0);

//     const { data: existingEvents } = await supabase
//       .from("attendance_events")
//       .select("id, occurred_at")
//       .eq("actor_id", member.id)
//       .eq("actor_type", "member")
//       .gte("occurred_at", todayStart.toISOString())
//       .in("result", ["success", "duplicate"])
//       .limit(1);

//     duplicateToday = Boolean(existingEvents && existingEvents.length > 0);
//   } else if (member) {
//     duplicateToday = Boolean(member.lastCheckIn && sameDay(member.lastCheckIn, new Date().toISOString()));
//   }

//   const response = buildKioskResponse(member, source, duplicateToday);

//   if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
//     const supabase = createAdminClient();
//     const { data: inserted } = await supabase
//       .from("attendance_events")
//       .insert({
//         actor_id: response.latestEvent?.actorId,
//         actor_type: "member",
//         source,
//         result: response.latestEvent?.result,
//         occurred_at: response.latestEvent?.occurredAt,
//         note: response.latestEvent?.note
//       })
//       .select("id")
//       .single();

//     if (response.latestEvent?.actorId && response.latestEvent.actorId !== "unknown" && inserted?.id && !duplicateToday) {
//       await supabase.from("daily_attendance").upsert(
//         {
//           actor_id: response.latestEvent.actorId,
//           actor_type: "member",
//           attendance_date: response.latestEvent.occurredAt.slice(0, 10),
//           first_event_id: inserted.id
//         },
//         { onConflict: "actor_id,actor_type,attendance_date" }
//       );
//     }
//   }

//   revalidatePath("/kiosk");
//   revalidatePath("/check-in");
//   revalidatePath("/admin");
//   revalidatePath("/trainer");

//   return response;
// }

// export async function recordTrainerAttendance(action: "login" | "logout") {
//   if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
//     revalidatePath("/trainer");
//     revalidatePath("/admin");
//     return;
//   }

//   const supabase = createAdminClient();
//   const { data: trainers } = await supabase.from("staff").select("id").eq("role", "trainer").eq("active", true).limit(1);
//   const trainerId = trainers?.[0]?.id;

//   if (!trainerId) {
//     throw new Error("No active trainer found to record attendance.");
//   }

//   const source = action === "login" ? "trainer-login" : "trainer-logout";
//   const occurredAt = new Date().toISOString();
//   const { data: inserted } = await supabase
//     .from("attendance_events")
//     .insert({
//       actor_id: trainerId,
//       actor_type: "trainer",
//       source,
//       result: "success",
//       occurred_at: occurredAt
//     })
//     .select("id")
//     .single();

//   if (action === "login" && inserted?.id) {
//     await supabase.from("daily_attendance").upsert(
//       {
//         actor_id: trainerId,
//         actor_type: "trainer",
//         attendance_date: occurredAt.slice(0, 10),
//         first_event_id: inserted.id
//       },
//       { onConflict: "actor_id,actor_type,attendance_date" }
//     );
//   }

//   revalidatePath("/trainer");
//   revalidatePath("/admin");
// }


import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import {
  AdminDashboardData,
  AlertItem,
  AttendanceEvent,
  AttendanceHeatPoint,
  DashboardStats,
  KioskCheckInResponse,
  Member,
  Membership,
  Payment,
  PersonProfileData,
  PersonSearchResult,
  Staff,
  TrendPoint,
  TrainerDashboardData
} from "@/lib/types";
import { mockAdminDashboardData, mockMembers, mockTrainerDashboardData } from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase-server";

const ATTENDANCE_TARGET = 20;

// --- Helper Functions ---

// function createAdminClient() {
//   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
//   const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
//   if (!supabaseUrl || !serviceRoleKey) throw new Error("Missing Supabase Keys");
//   return createClient(supabaseUrl, serviceRoleKey, {
//     auth: { persistSession: false, autoRefreshToken: false }
//   });
// }

function toNumber(value: any): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value) || 0;
  return 0;
}

function normalizeMemberCode(value: string) {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

function getLatestMembershipForMember(memberships: Membership[], memberId: string) {
  return memberships
    .filter((membership) => membership.memberId === memberId)
    .sort((left, right) => new Date(right.endDate).getTime() - new Date(left.endDate).getTime())[0];
}

function getCurrentMembershipForMember(memberships: Membership[], memberId: string) {
  const related = memberships
    .filter((membership) => membership.memberId === memberId)
    .sort((left, right) => new Date(right.endDate).getTime() - new Date(left.endDate).getTime());

  return related.find((membership) => membership.status === "active" || membership.status === "expiring") ?? related[0];
}

function getAttendanceTargetForMembership(membership?: Membership) {
  if (!membership) {
    return ATTENDANCE_TARGET;
  }

  const start = new Date(`${membership.startDate}T00:00:00Z`);
  const end = new Date(`${membership.endDate}T00:00:00Z`);
  const durationDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
  return Math.max(12, Math.round(durationDays / 2));
}

function getAttendanceStatusLabel(result: string) {
  switch (result) {
    case "success":
      return "Checked In";
    case "duplicate":
      return "Already Checked In";
    case "blocked":
      return "Access Blocked";
    case "invalid":
      return "Invalid Member";
    default:
      return result;
  }
}

function createComputedAlerts(members: Member[], memberships: Membership[], existingAlerts: AlertItem[]) {
  const alerts: AlertItem[] = [...existingAlerts];
  const now = new Date();
  const today = new Date(`${now.toISOString().slice(0, 10)}T00:00:00Z`);

  const latestMemberships = members
    .map((member) => ({
      member,
      membership: getLatestMembershipForMember(memberships, member.id)
    }))
    .filter((item) => item.membership);

  latestMemberships.forEach(({ member, membership }) => {
    if (!membership) {
      return;
    }

    const endDate = new Date(`${membership.endDate}T00:00:00Z`);
    const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / 86400000);

    if (membership.dueAmount > 0) {
      alerts.push({
        id: `due-${member.id}`,
        memberId: member.id,
        title: "Payment Due",
        description: `${member.fullName} has ${membership.dueAmount.toFixed(2)} pending on ${membership.planName}.`,
        severity: membership.dueAmount >= 1000 ? "critical" : "warning",
        dueOn: membership.endDate
      });
    }

    if (daysLeft >= 0 && daysLeft <= 5) {
      alerts.push({
        id: `expiring-${member.id}`,
        memberId: member.id,
        title: "Membership Expiring Soon",
        description: `${member.fullName}'s ${membership.planName} ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
        severity: daysLeft <= 2 ? "critical" : "warning",
        dueOn: membership.endDate
      });
    }

    if (daysLeft < 0 && membership.status !== "active") {
      alerts.push({
        id: `expired-${member.id}`,
        memberId: member.id,
        title: "Membership Expired",
        description: `${member.fullName}'s ${membership.planName} expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? "" : "s"} ago.`,
        severity: "critical",
        dueOn: membership.endDate
      });
    }

    if (member.streak >= 5) {
      alerts.push({
        id: `streak-${member.id}`,
        memberId: member.id,
        title: "Retention Suggestion",
        description: `${member.fullName} is on a ${member.streak}-day streak. Good time to suggest an upgrade or referral.`,
        severity: "info",
        dueOn: membership.endDate
      });
    }
  });

  return alerts
    .filter((alert, index, all) => all.findIndex((candidate) => candidate.id === alert.id) === index)
    .sort((left, right) => {
      const leftSeverity = { critical: 0, warning: 1, info: 2 }[left.severity];
      const rightSeverity = { critical: 0, warning: 1, info: 2 }[right.severity];
      if (leftSeverity !== rightSeverity) {
        return leftSeverity - rightSeverity;
      }
      return (left.dueOn ?? "9999-12-31").localeCompare(right.dueOn ?? "9999-12-31");
    })
    .slice(0, 8);
}

function calculateStreakFromEvents(eventDates: string[]) {
  const uniqueDays = [...new Set(eventDates.map((value) => value.slice(0, 10)))].sort((left, right) => right.localeCompare(left));

  if (!uniqueDays.length) {
    return 0;
  }

  let streak = 1;
  for (let index = 1; index < uniqueDays.length; index += 1) {
    const previous = new Date(`${uniqueDays[index - 1]}T00:00:00Z`);
    const current = new Date(`${uniqueDays[index]}T00:00:00Z`);
    const difference = Math.round((previous.getTime() - current.getTime()) / 86400000);

    if (difference === 1) {
      streak += 1;
      continue;
    }

    break;
  }

  return streak;
}

async function getMemberAttendanceStats(memberId: string) {
  const supabase = createAdminClient();
  const { data: events } = await supabase
    .from("attendance_events")
    .select("occurred_at, result")
    .eq("actor_id", memberId)
    .eq("actor_type", "member")
    .eq("result", "success")
    .order("occurred_at", { ascending: false });

  const successfulEvents = (events ?? []).map((event: any) => event.occurred_at as string);

  return {
    streak: calculateStreakFromEvents(successfulEvents),
    attended: successfulEvents.length,
    lastCheckIn: successfulEvents[0]
  };
}

function buildAttendanceStatsMap(events: Array<{ actor_id: string; occurred_at: string }>) {
  const byMember = new Map<string, string[]>();

  for (const event of events) {
    const existing = byMember.get(event.actor_id) ?? [];
    existing.push(event.occurred_at);
    byMember.set(event.actor_id, existing);
  }

  const stats = new Map<string, { streak: number; attended: number; lastCheckIn?: string; attendanceCalendar: AttendanceHeatPoint[]; streakTrend: TrendPoint[] }>();

  byMember.forEach((dates, memberId) => {
    const sorted = [...dates].sort((left, right) => right.localeCompare(left));
    const groupedByDay = new Map<string, number>();

    sorted.forEach((value) => {
      const day = value.slice(0, 10);
      groupedByDay.set(day, (groupedByDay.get(day) ?? 0) + 1);
    });

    const uniqueDays = [...groupedByDay.keys()].sort((left, right) => right.localeCompare(left));
    const monthlyGroups = new Map<string, number>();
    uniqueDays.forEach((day) => {
      const month = day.slice(0, 7);
      monthlyGroups.set(month, (monthlyGroups.get(month) ?? 0) + 1);
    });

    stats.set(memberId, {
      streak: calculateStreakFromEvents(sorted),
      attended: sorted.length,
      lastCheckIn: sorted[0],
      attendanceCalendar: [...groupedByDay.entries()].map(([date, count]) => ({ date, count })).sort((left, right) => left.date.localeCompare(right.date)),
      streakTrend: [...monthlyGroups.entries()].map(([label, value]) => ({ label, value })).sort((left, right) => left.label.localeCompare(right.label))
    });
  });

  return stats;
}

function buildFinancialTrend(payments: Payment[]): TrendPoint[] {
  const grouped = new Map<string, number>();
  payments.forEach((payment) => {
    const label = payment.paidOn.slice(0, 7);
    grouped.set(label, (grouped.get(label) ?? 0) + payment.amount);
  });

  return [...grouped.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => left.label.localeCompare(right.label))
    .slice(-6);
}

// --- Core Data Fetcher ---

export async function getAdminDashboardData(targetDate?: string): Promise<AdminDashboardData> {
  const dateStr = targetDate || new Date().toISOString().split('T')[0];

  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return mockAdminDashboardData;
  }

  const supabase = createAdminClient();

  // 1. Fetch data using relational joins
  // Profiles are joined to Members and Staff to get names/phones
  const [
    { data: memberRows },
    { data: staffRows },
    { data: membershipRows },
    { data: paymentRows },
    { data: alertRows },
    { data: eventRows },
    { data: dailyAttendance },
    { data: memberSuccessEvents }
  ] = await Promise.all([
    supabase.from("members").select("*, profiles(full_name, phone, email, photo_path)").order("joined_at", { ascending: false }),
    supabase.from("staff").select("*, profiles(full_name, email, phone, photo_path)").order("role").order("staff_code"),
    supabase.from("memberships").select("*").order("end_date", { ascending: false }),
    supabase.from("payments").select("*").order("paid_on", { ascending: false }),
    supabase.from("alert_queue").select("*").order("created_at", { ascending: false }),
    supabase.from("attendance_events")
      .select("*")
      .gte("occurred_at", `${dateStr}T00:00:00Z`)
      .lte("occurred_at", `${dateStr}T23:59:59Z`)
      .order("occurred_at", { ascending: false }),
    supabase.from("daily_attendance").select("*"),
    supabase.from("attendance_events").select("actor_id, occurred_at").eq("actor_type", "member").eq("result", "success").order("occurred_at", { ascending: false })
  ]);

  // 2. Map Memberships & Payments with type safety
  const memberships: Membership[] = (membershipRows || []).map((row: any) => ({
    id: row.id,
    memberId: row.member_id,
    planName: row.plan_name,
    startDate: row.start_date,
    endDate: row.end_date,
    totalFee: toNumber(row.total_fee),
    dueAmount: toNumber(row.due_amount),
    status: row.status
  }));

  const payments: Payment[] = (paymentRows || []).map((row: any) => ({
    id: row.id,
    memberId: row.member_id,
    amount: toNumber(row.amount),
    method: row.method,
    paidOn: row.paid_on,
    receivedBy: row.received_by || "system"
  }));

  // 3. Transform Members (Handling the nested profile)
  const memberAttendanceStats = buildAttendanceStatsMap((memberSuccessEvents || []) as Array<{ actor_id: string; occurred_at: string }>);
  const trainerNameMap = new Map(
    (staffRows || [])
      .filter((staff: any) => staff.role === "trainer")
      .map((staff: any) => [staff.id, { name: staff.profiles?.full_name || "Trainer", code: staff.staff_code }])
  );

  const membersList: Member[] = (memberRows || []).map((m: any) => {
    const currentMembership = getCurrentMembershipForMember(memberships, m.id);
    const attendanceStats = memberAttendanceStats.get(m.id);
    const daysLeft = currentMembership ? Math.max(0, Math.ceil((new Date(`${currentMembership.endDate}T23:59:59Z`).getTime() - Date.now()) / 86400000)) : 0;
    const assignedTrainer = trainerNameMap.get(m.personal_trainer_id);
    
    return {
      id: m.id,
      profileId: m.profile_id || undefined,
      memberCode: m.member_code,
      fullName: m.profiles?.full_name || "Unknown Member",
      phone: m.profiles?.phone || undefined,
      email: m.profiles?.email || undefined,
      photoPath: m.profiles?.photo_path || undefined,
      active: m.active,
      joinedAt: m.joined_at,
      currentPlan: currentMembership?.planName || "No active plan",
      personalTrainerId: m.personal_trainer_id || undefined,
      personalTrainerName: assignedTrainer?.name,
      hasPersonalTrainer: Boolean(assignedTrainer),
      daysLeft,
      dueAmount: currentMembership?.dueAmount || 0,
      streak: attendanceStats?.streak || 0,
      attendanceProgress: {
        attended: attendanceStats?.attended || 0,
        target: getAttendanceTargetForMembership(currentMembership)
      },
      lastCheckIn: attendanceStats?.lastCheckIn
    };
  });

  // 4. Transform Attendance Events (Injecting names for the UI)
  const attendanceEvents = (eventRows || []).map((row: any) => {
    let actorName = "Unknown";
    if (row.actor_type === "member") {
      const match = membersList.find(m => m.id === row.actor_id);
      actorName = match?.fullName || "Member";
      return {
        id: row.id,
        actorId: row.actor_id,
        actorType: row.actor_type,
        actorName,
        photoPath: match?.photoPath,
        source: row.source,
        result: getAttendanceStatusLabel(row.result),
        occurredAt: row.occurred_at,
        note: row.note
      };
    } else {
      const match = (staffRows || []).find((s: any) => s.id === row.actor_id);
      actorName = match?.profiles?.full_name || "Staff";
      return {
        id: row.id,
        actorId: row.actor_id,
        actorType: row.actor_type,
        actorName,
        photoPath: match?.profiles?.photo_path || undefined,
        source: row.source,
        result: getAttendanceStatusLabel(row.result),
        occurredAt: row.occurred_at,
        note: row.note
      };
    }
  });

  const trainers: Staff[] = (staffRows || [])
    .filter((s: any) => s.role === 'trainer')
    .map((s: any) => ({
      id: s.id,
      profileId: s.profile_id || undefined,
      staffCode: s.staff_code,
      fullName: s.profiles?.full_name || "Trainer",
      email: s.profiles?.email || undefined,
      phone: s.profiles?.phone || undefined,
      photoPath: s.profiles?.photo_path || undefined,
      role: s.role,
      active: s.active,
      specialization: s.specialization || undefined,
      todayStatus: ((eventRows || []).find((event: any) => event.actor_type === "trainer" && event.actor_id === s.id)?.source === "trainer-logout")
        ? "checked-out"
        : ((eventRows || []).find((event: any) => event.actor_type === "trainer" && event.actor_id === s.id) ? "checked-in" : "offline")
    }));

  // 5. Build Final Stats object
  const stats: DashboardStats = {
    totalMembers: membersList.length,
    activeMembers: membersList.filter(m => m.active).length,
    activeTrainers: trainers.filter(t => t.active).length,
    collectionsThisMonth: payments
      .filter(p => {
        const paidOn = new Date(p.paidOn);
        const now = new Date();
        return paidOn.getMonth() === now.getMonth() && paidOn.getFullYear() === now.getFullYear();
      })
      .reduce((acc, p) => acc + p.amount, 0),
    outstandingDues: memberships.reduce((acc, m) => acc + m.dueAmount, 0),
    profitEstimate: Math.max(
      payments
        .filter(p => {
          const paidOn = new Date(p.paidOn);
          const now = new Date();
          return paidOn.getMonth() === now.getMonth() && paidOn.getFullYear() === now.getFullYear();
        })
        .reduce((acc, p) => acc + p.amount, 0) - memberships.reduce((acc, m) => acc + m.dueAmount, 0),
      0
    ),
    memberAttendanceToday: attendanceEvents.filter(e => e.actorType === 'member' && e.result === 'Checked In').length,
    trainerAttendanceToday: (dailyAttendance || []).filter((row: any) => row.actor_type === "trainer" && row.attendance_date === dateStr).length
  };

  const persistedAlerts: AlertItem[] = (alertRows || []).map((a: any) => ({
    id: a.id,
    memberId: a.member_id ?? undefined,
    title: a.title,
    description: a.description,
    severity: a.severity,
    dueOn: a.due_on
  }));

  return {
    stats,
    members: membersList,
    trainers,
    memberships,
    payments,
    alerts: createComputedAlerts(membersList, memberships, persistedAlerts),
    attendanceEvents: attendanceEvents as any
  };
}

// function createAdminClient() {
//   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
//   const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
//   if (!supabaseUrl || !serviceRoleKey) throw new Error("Missing Supabase Keys");
//   return createClient(supabaseUrl, serviceRoleKey, {
//     auth: { persistSession: false, autoRefreshToken: false }
//   });
// }


// Helper to create admin client
const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
};

export async function markMemberAttendance(
  memberCode: string, 
  source: "kiosk" | "qr"
): Promise<KioskCheckInResponse> {
  const supabase = createAdminClient();
  const member = await findMemberByCode(memberCode);

  if (!member) {
    return {
      ok: false,
      message: "Member ID not found. Check the Luxe ID format and try again.",
    };
  }

  // 2. Check if member is active
  if (!member.active) {
    return {
      ok: false,
      message: "Membership is inactive. Please see the front desk.",
      member
    };
  }

  // 3. Log the attendance event
  const { error: eventError } = await supabase
    .from("attendance_events")
    .insert({
      actor_id: member.id,
      actor_type: "member",
      source: source,
      result: "success",
      occurred_at: new Date().toISOString()
    });

  if (eventError) throw eventError;

  // 4. Prepare UI-friendly data
  const attendanceStats = await getMemberAttendanceStats(member.id);

  return {
    ok: true,
    message: "Check-in successful. Have a great workout!",
    member: {
      ...member,
      streak: attendanceStats.streak,
      attendanceProgress: { attended: attendanceStats.attended, target: ATTENDANCE_TARGET },
      lastCheckIn: attendanceStats.lastCheckIn
    }
  };
}

export async function getTrainerDashboardData(trainerCode?: string): Promise<TrainerDashboardData> {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return mockTrainerDashboardData;
  }

  const adminData = await getAdminDashboardData();
  const matchedTrainer = trainerCode
    ? adminData.trainers.find((trainer) => trainer.staffCode?.toLowerCase() === trainerCode.toLowerCase())
    : adminData.trainers[0];

  return {
    trainer: matchedTrainer ?? adminData.trainers[0] ?? mockTrainerDashboardData.trainer,
    visibleMembers: adminData.members.filter((member) => member.active),
    recentEvents: adminData.attendanceEvents
      .filter((event) => event.actorType === "member")
      .slice(0, 8) as TrainerDashboardData["recentEvents"]
  };
}

export async function findMemberByCode(memberCode: string) {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const normalizedMemberCode = normalizeMemberCode(memberCode);
    return mockMembers.find((member) => normalizeMemberCode(member.memberCode) === normalizedMemberCode) ?? null;
  }

  const supabase = createAdminClient();
  const normalizedMemberCode = normalizeMemberCode(memberCode);
  let member: any = null;

  const primaryQuery = await supabase
    .from("members")
    .select(`
      id,
      profile_id,
      member_code,
      active,
      personal_trainer_id,
      joined_at,
      profiles (full_name, phone, email, photo_path),
      memberships (plan_name, end_date, due_amount)
    `)
    .ilike("member_code", normalizedMemberCode)
    .maybeSingle();

  if (primaryQuery.error && primaryQuery.error.message.includes("personal_trainer_id")) {
    const fallbackQuery = await supabase
      .from("members")
      .select(`
        id,
        profile_id,
        member_code,
        active,
        joined_at,
        profiles (full_name, phone, email, photo_path),
        memberships (plan_name, end_date, due_amount)
      `)
      .ilike("member_code", normalizedMemberCode)
      .maybeSingle();

    member = fallbackQuery.data;
  } else {
    member = primaryQuery.data;
  }

  if (!member) {
    return null;
  }

  const attendanceStats = await getMemberAttendanceStats(member.id);
  const latestMembership = (member.memberships as any[])?.[0];
  const { data: assignedTrainer } = member.personal_trainer_id
    ? await supabase.from("staff").select("id, profiles(full_name)").eq("id", member.personal_trainer_id).maybeSingle()
    : { data: null };
  const daysLeft = latestMembership
    ? Math.max(0, Math.ceil((new Date(latestMembership.end_date).getTime() - Date.now()) / 86400000))
    : 0;

  return {
    id: member.id,
    profileId: member.profile_id || undefined,
    memberCode: member.member_code,
    fullName: (member.profiles as any)?.full_name || "Member",
    phone: (member.profiles as any)?.phone || undefined,
    email: (member.profiles as any)?.email || undefined,
    photoPath: (member.profiles as any)?.photo_path || undefined,
    active: member.active,
    joinedAt: member.joined_at,
    currentPlan: latestMembership?.plan_name || "Standard",
    personalTrainerId: member.personal_trainer_id || undefined,
    personalTrainerName: (assignedTrainer as any)?.profiles?.full_name || undefined,
    hasPersonalTrainer: Boolean(assignedTrainer),
    daysLeft,
    dueAmount: latestMembership?.due_amount || 0,
    streak: attendanceStats.streak,
    attendanceProgress: { attended: attendanceStats.attended, target: ATTENDANCE_TARGET },
    lastCheckIn: attendanceStats.lastCheckIn
  };
}

export async function searchPeople(query: string): Promise<PersonSearchResult[]> {
  const value = query.trim().toLowerCase();
  if (!value) {
    return [];
  }

  const dashboard = await getAdminDashboardData();
  const memberResults = dashboard.members
    .filter((member) =>
      member.fullName.toLowerCase().includes(value) ||
      member.memberCode.toLowerCase().includes(value) ||
      member.phone?.replace(/\D/g, "").includes(query.replace(/\D/g, ""))
    )
    .map((member) => ({
      id: member.id,
      type: "member" as const,
      fullName: member.fullName,
      phone: member.phone,
      code: member.memberCode,
      photoPath: member.photoPath,
      roleLabel: member.currentPlan
    }));

  const trainerResults = dashboard.trainers
    .filter((trainer) =>
      trainer.fullName.toLowerCase().includes(value) ||
      trainer.staffCode?.toLowerCase().includes(value) ||
      trainer.phone?.replace(/\D/g, "").includes(query.replace(/\D/g, ""))
    )
    .map((trainer) => ({
      id: trainer.id,
      type: "trainer" as const,
      fullName: trainer.fullName,
      phone: trainer.phone,
      code: trainer.staffCode ?? trainer.id,
      photoPath: trainer.photoPath,
      roleLabel: trainer.specialization ?? "Trainer"
    }));

  return [...memberResults, ...trainerResults].slice(0, 12);
}

export async function getPersonProfile(id: string, type: "member" | "trainer"): Promise<PersonProfileData | null> {
  const dashboard = await getAdminDashboardData();
  const supabase = createAdminClient();

  if (type === "member") {
    const member = dashboard.members.find((entry) => entry.id === id);
    if (!member) {
      return null;
    }

    const { data: attendanceEvents } = await supabase
      .from("attendance_events")
      .select("occurred_at")
      .eq("actor_id", id)
      .eq("actor_type", "member")
      .eq("result", "success")
      .order("occurred_at", { ascending: false });

    const { data: payments } = await supabase
      .from("payments")
      .select("*")
      .eq("member_id", id)
      .order("paid_on", { ascending: false });

    const statsMap = buildAttendanceStatsMap(
      ((attendanceEvents || []) as Array<{ occurred_at: string }>).map((event) => ({ actor_id: id, occurred_at: event.occurred_at }))
    );
    const attendanceStats = statsMap.get(id);
    const memberPayments = ((payments || []) as any[]).map((row) => ({
      id: row.id,
      memberId: row.member_id,
      amount: toNumber(row.amount),
      method: row.method,
      paidOn: row.paid_on,
      notes: row.notes ?? undefined,
      receivedBy: row.received_by || "system"
    })) as Payment[];

    return {
      result: {
        id: member.id,
        type: "member",
        fullName: member.fullName,
        phone: member.phone,
        code: member.memberCode,
        photoPath: member.photoPath,
        roleLabel: member.currentPlan
      },
      member: {
        ...member,
        streak: attendanceStats?.streak ?? member.streak,
        attendanceProgress: {
          ...member.attendanceProgress,
          attended: attendanceStats?.attended ?? member.attendanceProgress.attended
        },
        lastCheckIn: attendanceStats?.lastCheckIn ?? member.lastCheckIn
      },
      attendanceCalendar: attendanceStats?.attendanceCalendar ?? [],
      streakTrend: attendanceStats?.streakTrend ?? [],
      financialTrend: buildFinancialTrend(memberPayments),
      totalPaid: memberPayments.reduce((sum, payment) => sum + payment.amount, 0),
      totalDue: member.dueAmount,
      recentPayments: memberPayments.slice(0, 8)
    };
  }

  const trainer = dashboard.trainers.find((entry) => entry.id === id);
  if (!trainer) {
    return null;
  }

  const { data: attendanceEvents } = await supabase
    .from("attendance_events")
    .select("occurred_at")
    .eq("actor_id", id)
    .eq("actor_type", "trainer")
    .eq("result", "success")
    .order("occurred_at", { ascending: false });

  const groupedByDay = new Map<string, number>();
  (attendanceEvents || []).forEach((event: any) => {
    const day = String(event.occurred_at).slice(0, 10);
    groupedByDay.set(day, (groupedByDay.get(day) ?? 0) + 1);
  });

  const groupedByMonth = new Map<string, number>();
  groupedByDay.forEach((count, day) => {
    const month = day.slice(0, 7);
    groupedByMonth.set(month, (groupedByMonth.get(month) ?? 0) + count);
  });

  return {
    result: {
      id: trainer.id,
      type: "trainer",
      fullName: trainer.fullName,
      phone: trainer.phone,
      code: trainer.staffCode ?? trainer.id,
      photoPath: trainer.photoPath,
      roleLabel: trainer.specialization ?? "Trainer"
    },
    trainer,
    attendanceCalendar: [...groupedByDay.entries()].map(([date, count]) => ({ date, count })).sort((left, right) => left.date.localeCompare(right.date)),
    streakTrend: [...groupedByMonth.entries()].map(([label, value]) => ({ label, value })).sort((left, right) => left.label.localeCompare(right.label))
  };
}

export async function recordTrainerAttendance(action: "login" | "logout", trainerCode?: string) {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    revalidatePath("/trainer");
    revalidatePath("/admin");
    return;
  }

  const supabase = createAdminClient();
  let trainerQuery = supabase
    .from("staff")
    .select("id, staff_code")
    .eq("role", "trainer")
    .eq("active", true)
    .limit(1);

  if (trainerCode) {
    trainerQuery = trainerQuery.eq("staff_code", trainerCode.toUpperCase());
  }

  const { data: trainers, error } = await trainerQuery;

  if (error) {
    throw error;
  }

  const trainerId = trainers?.[0]?.id;
  if (!trainerId) {
    throw new Error("No active trainer found for that Luxe ID.");
  }

  const occurredAt = new Date().toISOString();
  const source = action === "login" ? "trainer-login" : "trainer-logout";

  const { error: insertError } = await supabase.from("attendance_events").insert({
    actor_id: trainerId,
    actor_type: "trainer",
    source,
    result: "success",
    occurred_at: occurredAt
  });

  if (insertError) {
    throw insertError;
  }

  revalidatePath("/trainer");
  revalidatePath("/admin");
}

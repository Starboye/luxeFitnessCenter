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
  DashboardStats,
  KioskCheckInResponse,
  Member,
  Membership,
  Payment,
  Staff,
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

function getLatestMembershipForMember(memberships: Membership[], memberId: string) {
  return memberships
    .filter((membership) => membership.memberId === memberId)
    .sort((left, right) => new Date(right.endDate).getTime() - new Date(left.endDate).getTime())[0];
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
    { data: dailyAttendance }
  ] = await Promise.all([
    supabase.from("members").select("*, profiles(full_name, phone)").order("joined_at", { ascending: false }),
    supabase.from("staff").select("*, profiles(full_name, email)").order("role").order("staff_code"),
    supabase.from("memberships").select("*").order("end_date", { ascending: false }),
    supabase.from("payments").select("*").order("paid_on", { ascending: false }),
    supabase.from("alert_queue").select("*").order("created_at", { ascending: false }),
    supabase.from("attendance_events")
      .select("*")
      .gte("occurred_at", `${dateStr}T00:00:00Z`)
      .lte("occurred_at", `${dateStr}T23:59:59Z`)
      .order("occurred_at", { ascending: false }),
    supabase.from("daily_attendance").select("*")
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
  const membersList: Member[] = (memberRows || []).map((m: any) => {
    const latest = getLatestMembershipForMember(memberships, m.id);
    const daysLeft = latest ? Math.max(0, Math.ceil((new Date(latest.endDate).getTime() - Date.now()) / 86400000)) : 0;
    
    return {
      id: m.id,
      memberCode: m.member_code,
      fullName: m.profiles?.full_name || "Unknown Member",
      phone: m.profiles?.phone || undefined,
      active: m.active,
      joinedAt: m.joined_at,
      currentPlan: latest?.planName || "No active plan",
      daysLeft,
      dueAmount: latest?.dueAmount || 0,
      streak: 0, 
      attendanceProgress: { attended: 0, target: ATTENDANCE_TARGET }
    };
  });

  // 4. Transform Attendance Events (Injecting names for the UI)
  const attendanceEvents = (eventRows || []).map((row: any) => {
    let actorName = "Unknown";
    if (row.actor_type === "member") {
      const match = membersList.find(m => m.id === row.actor_id);
      actorName = match?.fullName || "Member";
    } else {
      const match = (staffRows || []).find((s: any) => s.id === row.actor_id);
      actorName = match?.profiles?.full_name || "Staff";
    }

    return {
      id: row.id,
      actorId: row.actor_id,
      actorType: row.actor_type,
      actorName, 
      source: row.source,
      result: getAttendanceStatusLabel(row.result),
      occurredAt: row.occurred_at,
      note: row.note
    };
  });

  const trainers: Staff[] = (staffRows || [])
    .filter((s: any) => s.role === 'trainer')
    .map((s: any) => ({
      id: s.id,
      staffCode: s.staff_code,
      fullName: s.profiles?.full_name || "Trainer",
      email: s.profiles?.email || undefined,
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
    profitEstimate: 0, // Calculate as needed
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

  // 1. Fetch member with their profile and latest membership status
  const { data: member, error: memberError } = await supabase
    .from("members")
    .select(`
      id,
      member_code,
      active,
      profiles (full_name),
      memberships (plan_name, end_date, due_amount, status)
    `)
    .eq("member_code", memberCode.toUpperCase())
    .single();

  if (memberError || !member) {
    return {
      ok: false,
      message: "Member not found. Please check the ID and try again.",
    };
  }

  // 2. Check if member is active
  if (!member.active) {
    return {
      ok: false,
      message: "Membership is inactive. Please see the front desk.",
      member: {
        id: member.id,
        fullName: (member.profiles as any)?.full_name || "Member",
        // Map other fields as needed for the UI
      } as any
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
  const latestMembership = (member.memberships as any[])?.[0];
  const attendanceStats = await getMemberAttendanceStats(member.id);
  const daysLeft = latestMembership 
    ? Math.max(0, Math.ceil((new Date(latestMembership.end_date).getTime() - Date.now()) / 86400000)) 
    : 0;

  return {
    ok: true,
    message: "Check-in successful. Have a great workout!",
    member: {
      id: member.id,
      memberCode: member.member_code,
      fullName: (member.profiles as any)?.full_name || "Member",
      currentPlan: latestMembership?.plan_name || "Standard",
      daysLeft: daysLeft,
      dueAmount: latestMembership?.due_amount || 0,
      streak: attendanceStats.streak,
      active: true,
      joinedAt: new Date().toISOString(),
      attendanceProgress: { attended: attendanceStats.attended, target: ATTENDANCE_TARGET },
      lastCheckIn: attendanceStats.lastCheckIn
    } as any
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
    return mockMembers.find((member) => member.memberCode.toLowerCase() === memberCode.toLowerCase()) ?? null;
  }

  const supabase = createAdminClient();
  const { data: member } = await supabase
    .from("members")
    .select(`
      id,
      member_code,
      active,
      joined_at,
      profiles (full_name, phone),
      memberships (plan_name, end_date, due_amount)
    `)
    .eq("member_code", memberCode.toUpperCase())
    .single();

  if (!member) {
    return null;
  }

  const attendanceStats = await getMemberAttendanceStats(member.id);
  const latestMembership = (member.memberships as any[])?.[0];
  const daysLeft = latestMembership
    ? Math.max(0, Math.ceil((new Date(latestMembership.end_date).getTime() - Date.now()) / 86400000))
    : 0;

  return {
    id: member.id,
    memberCode: member.member_code,
    fullName: (member.profiles as any)?.full_name || "Member",
    phone: (member.profiles as any)?.phone || undefined,
    active: member.active,
    joinedAt: member.joined_at,
    currentPlan: latestMembership?.plan_name || "Standard",
    daysLeft,
    dueAmount: latestMembership?.due_amount || 0,
    streak: attendanceStats.streak,
    attendanceProgress: { attended: attendanceStats.attended, target: ATTENDANCE_TARGET },
    lastCheckIn: attendanceStats.lastCheckIn
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

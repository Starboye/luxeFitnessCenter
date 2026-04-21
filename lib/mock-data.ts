import {
  AdminDashboardData,
  AlertItem,
  AttendanceEvent,
  Member,
  Membership,
  Payment,
  Staff,
  TrainerDashboardData
} from "@/lib/types";

export const mockMembers: Member[] = [
  {
    id: "member-1",
    memberCode: "LUXE-1001",
    fullName: "Arun Prakash",
    phone: "+91 98765 11111",
    active: true,
    joinedAt: "2026-01-04T08:00:00.000Z",
    currentPlan: "Strength Plus - 45 Days",
    daysLeft: 18,
    dueAmount: 0,
    streak: 6,
    attendanceProgress: { attended: 16, target: 24 },
    lastCheckIn: "2026-04-13T05:30:00.000Z"
  },
  {
    id: "member-2",
    memberCode: "LUXE-1002",
    fullName: "Nivetha S",
    phone: "+91 98765 22222",
    active: true,
    joinedAt: "2026-02-08T09:15:00.000Z",
    currentPlan: "Body Recomp - 30 Days",
    daysLeft: 4,
    dueAmount: 1500,
    streak: 3,
    attendanceProgress: { attended: 10, target: 20 },
    lastCheckIn: "2026-04-12T12:00:00.000Z"
  },
  {
    id: "member-3",
    memberCode: "LUXE-1003",
    fullName: "Karthik Raja",
    phone: "+91 98765 33333",
    active: false,
    joinedAt: "2025-10-20T07:00:00.000Z",
    currentPlan: "Open Gym Access",
    daysLeft: 0,
    dueAmount: 3200,
    streak: 0,
    attendanceProgress: { attended: 2, target: 20 },
    lastCheckIn: "2026-03-28T10:15:00.000Z"
  }
];

export const mockStaff: Staff[] = [
  {
    id: "staff-1",
    fullName: "Vignesh Kumar",
    email: "trainer@luxefitness.in",
    role: "trainer",
    active: true,
    specialization: "Strength Coach",
    todayStatus: "checked-in"
  },
  {
    id: "staff-2",
    fullName: "Ananya Devi",
    email: "admin@luxefitness.in",
    role: "admin",
    active: true,
    specialization: "Operations",
    todayStatus: "checked-in"
  }
];

export const mockMemberships: Membership[] = [
  {
    id: "membership-1",
    memberId: "member-1",
    planName: "Strength Plus - 45 Days",
    startDate: "2026-03-17",
    endDate: "2026-05-01",
    totalFee: 7500,
    dueAmount: 0,
    status: "active"
  },
  {
    id: "membership-2",
    memberId: "member-2",
    planName: "Body Recomp - 30 Days",
    startDate: "2026-03-18",
    endDate: "2026-04-17",
    totalFee: 6800,
    dueAmount: 1500,
    status: "expiring"
  },
  {
    id: "membership-3",
    memberId: "member-3",
    planName: "Open Gym Access",
    startDate: "2026-02-15",
    endDate: "2026-03-15",
    totalFee: 6200,
    dueAmount: 3200,
    status: "expired"
  }
];

export const mockPayments: Payment[] = [
  {
    id: "payment-1",
    memberId: "member-1",
    amount: 7500,
    method: "upi",
    paidOn: "2026-03-17",
    receivedBy: "staff-2",
    notes: "Paid in full"
  },
  {
    id: "payment-2",
    memberId: "member-2",
    amount: 5300,
    method: "cash",
    paidOn: "2026-03-18",
    receivedBy: "staff-2",
    notes: "Balance pending"
  }
];

export const mockAttendanceEvents: AttendanceEvent[] = [
  {
    id: "event-1",
    actorId: "member-1",
    actorType: "member",
    source: "kiosk",
    result: "success",
    occurredAt: "2026-04-13T05:30:00.000Z",
    note: "Morning check-in"
  },
  {
    id: "event-2",
    actorId: "member-1",
    actorType: "member",
    source: "qr",
    result: "duplicate",
    occurredAt: "2026-04-13T05:42:00.000Z",
    note: "Repeated scan"
  },
  {
    id: "event-3",
    actorId: "member-2",
    actorType: "member",
    source: "qr",
    result: "success",
    occurredAt: "2026-04-12T12:00:00.000Z"
  },
  {
    id: "event-4",
    actorId: "staff-1",
    actorType: "trainer",
    source: "trainer-login",
    result: "success",
    occurredAt: "2026-04-13T04:50:00.000Z"
  }
];

export const mockAlerts: AlertItem[] = [
  {
    id: "alert-1",
    memberId: "member-2",
    title: "Plan ending soon",
    description: "Nivetha's plan ends in 4 days. Offer renewal during next visit.",
    severity: "warning",
    dueOn: "2026-04-17"
  },
  {
    id: "alert-2",
    memberId: "member-3",
    title: "Pending dues",
    description: "Karthik has Rs 3,200 outstanding on an expired plan.",
    severity: "critical",
    dueOn: "2026-04-13"
  }
];

export const mockAdminDashboardData: AdminDashboardData = {
  stats: {
    totalMembers: 148,
    activeMembers: 131,
    activeTrainers: 7,
    collectionsThisMonth: 284500,
    outstandingDues: 46300,
    profitEstimate: 173200,
    memberAttendanceToday: 74,
    trainerAttendanceToday: 6
  },
  members: mockMembers,
  trainers: mockStaff.filter((person) => person.role === "trainer"),
  memberships: mockMemberships,
  payments: mockPayments,
  alerts: mockAlerts,
  attendanceEvents: mockAttendanceEvents
};

export const mockTrainerDashboardData: TrainerDashboardData = {
  trainer: mockStaff[0],
  visibleMembers: mockMembers.filter((member) => member.active),
  recentEvents: mockAttendanceEvents.filter((event) => event.actorType === "member")
};

export type AttendanceSource = "kiosk" | "qr" | "trainer-login" | "trainer-logout";
export type AttendanceActorType = "member" | "trainer";
export type AttendanceResult = "success" | "duplicate" | "invalid" | "blocked";
export type StaffRole = "admin" | "trainer";
export type MembershipStatus = "active" | "expiring" | "expired" | "due";
export type PaymentMethod = "cash" | "upi" | "card" | "bank-transfer";
export type AlertSeverity = "info" | "warning" | "critical";

export interface Profile {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
}

export interface Member extends Profile {
  memberCode: string;
  active: boolean;
  joinedAt: string;
  currentPlan: string;
  daysLeft: number;
  dueAmount: number;
  streak: number;
  attendanceProgress: {
    attended: number;
    target: number;
  };
  lastCheckIn?: string;
}

export interface Staff extends Profile {
  staffCode?: string;
  role: StaffRole;
  active: boolean;
  specialization?: string;
  todayStatus?: "checked-in" | "checked-out" | "offline";
}

export interface Membership {
  id: string;
  memberId: string;
  planName: string;
  startDate: string;
  endDate: string;
  totalFee: number;
  dueAmount: number;
  status: MembershipStatus;
}

export interface Payment {
  id: string;
  memberId: string;
  amount: number;
  method: PaymentMethod;
  paidOn: string;
  notes?: string;
  receivedBy: string;
}

export interface AttendanceEvent {
  id: string;
  actorId: string;
  actorType: AttendanceActorType;
  source: AttendanceSource;
  result: AttendanceResult;
  occurredAt: string;
  note?: string;
}

export interface DailyAttendance {
  id: string;
  actorId: string;
  actorType: AttendanceActorType;
  date: string;
  firstEventId: string;
}

export interface AlertItem {
  id: string;
  memberId?: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  dueOn?: string;
}

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  activeTrainers: number;
  collectionsThisMonth: number;
  outstandingDues: number;
  profitEstimate: number;
  memberAttendanceToday: number;
  trainerAttendanceToday: number;
}

export interface KioskCheckInResponse {
  ok: boolean;
  message: string;
  member?: Member;
  latestEvent?: AttendanceEvent;
}

export interface AdminDashboardData {
  stats: DashboardStats;
  members: Member[];
  trainers: Staff[];
  memberships: Membership[];
  payments: Payment[];
  alerts: AlertItem[];
  attendanceEvents: AttendanceEvent[];
}

export interface TrainerDashboardData {
  trainer: Staff;
  visibleMembers: Member[];
  recentEvents: AttendanceEvent[];
}

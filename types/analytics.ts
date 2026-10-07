import type { ActivityLog } from "./activity";
import type { AppointmentWithRelations } from "./appointment";
import type { PaymentRecord } from "./billing";
import type { ISODate, ISODateTime } from "./common";
import type { PatientListItem } from "./patient";

export interface ComparedValue {
  value: number;
  previous: number;
}

export interface SeriesPoint {
  label: string;
  [series: string]: string | number;
}

export interface DashboardSummary {
  patients: { total: number; active: number; newThisMonth: number; newPrevious: number };
  appointments: { today: number; upcoming: number; completedThisMonth: number; cancelledThisMonth: number; noShowThisMonth: number };
  todayRevenue: number;
  revenue: ComparedValue;
  expenses: ComparedValue;
  netRevenue: number;
  pendingPayments: { amount: number; invoices: number };
  activeServices: number;
  followUpsDue: number;
  revenueTrend: SeriesPoint[];
  patientGrowth: SeriesPoint[];
  appointmentTrend: SeriesPoint[];
  paymentCollection: { label: string; value: number }[];
  expenseOverview: { label: string; value: number }[];
  servicePerformance: { label: string; value: number; count: number }[];
  upcomingAppointments: AppointmentWithRelations[];
  recentPatients: PatientListItem[];
  recentPayments: PaymentRecord[];
  recentActivity: ActivityLog[];
}

export const REPORT_SLUGS = [
  "daily",
  "patients",
  "appointments",
  "consultations",
  "services",
  "payments",
  "revenue",
  "expenses",
  "profit-loss",
  "members",
  "referrals",
  "branches",
  "outstanding",
  "activity",
] as const;
export type ReportSlug = (typeof REPORT_SLUGS)[number];

/** Filter keys a report can expose. */
export type ReportFilterKey =
  | "provider"
  | "gender"
  | "referral"
  | "service"
  | "appointmentStatus"
  | "paymentMethod"
  | "expenseCategory"
  | "member"
  | "module";

export interface ReportFilters {
  from: ISODate;
  to: ISODate;
  /** "all" = consolidated across branches. */
  branchId: string;
  provider?: string;
  gender?: string;
  referral?: string;
  service?: string;
  appointmentStatus?: string;
  paymentMethod?: string;
  expenseCategory?: string;
  member?: string;
  module?: string;
}

export type ValueFormat = "currency" | "number" | "percent" | "date" | "datetime" | "text";

export interface ReportColumn {
  key: string;
  label: string;
  format?: ValueFormat;
  align?: "left" | "right";
}

export type ReportCell = string | number | null;
export type ReportRow = Record<string, ReportCell>;

export interface ReportSummaryItem {
  label: string;
  value: number;
  format: ValueFormat;
  hint?: string;
}

export interface ReportChart {
  id: string;
  title: string;
  type: "bar" | "line" | "breakdown";
  format: ValueFormat;
  data: SeriesPoint[];
  series: { key: string; label: string }[];
}

export interface ReportResult {
  slug: ReportSlug;
  title: string;
  description: string;
  generatedAt: ISODateTime;
  appliedFilters: { label: string; value: string }[];
  summary: ReportSummaryItem[];
  charts: ReportChart[];
  columns: ReportColumn[];
  rows: ReportRow[];
  totals: ReportRow | null;
}

import type { ReportFilterKey, ReportSlug } from "@/types";

export interface ReportDefinition {
  slug: ReportSlug;
  title: string;
  description: string;
  group: "Operations" | "Clinical" | "Finance" | "Team & Growth" | "Compliance";
  filters: ReportFilterKey[];
  /** Branch filter is meaningless for the branch comparison report. */
  branchScoped: boolean;
}

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  { slug: "daily", title: "Daily Report", description: "Day-by-day patients, appointments, services, collections and expenses.", group: "Operations", filters: ["provider"], branchScoped: true },
  { slug: "appointments", title: "Appointment Report", description: "Bookings by status, provider, date and service, including no-shows.", group: "Operations", filters: ["provider", "service", "appointmentStatus"], branchScoped: true },
  { slug: "outstanding", title: "Payment Due / Outstanding", description: "Unpaid and partially paid invoices with ageing.", group: "Finance", filters: ["provider"], branchScoped: true },
  { slug: "patients", title: "Patient Report", description: "New and returning patients, demographics, referral sources and status.", group: "Clinical", filters: ["gender", "referral", "provider"], branchScoped: true },
  { slug: "consultations", title: "Consultation Report", description: "Consultations by provider and date, new vs follow-up and conversion.", group: "Clinical", filters: ["provider"], branchScoped: true },
  { slug: "services", title: "Clinical Service Report", description: "Services delivered by type and provider, completion and revenue.", group: "Clinical", filters: ["provider", "service"], branchScoped: true },
  { slug: "payments", title: "Payment Report", description: "Collections by payment method, refunds and pending amounts.", group: "Finance", filters: ["paymentMethod", "provider"], branchScoped: true },
  { slug: "revenue", title: "Revenue Report", description: "Revenue trend and revenue by service, provider and branch.", group: "Finance", filters: ["provider", "service"], branchScoped: true },
  { slug: "expenses", title: "Expense Report", description: "Expenses by category, branch and month.", group: "Finance", filters: ["expenseCategory", "paymentMethod"], branchScoped: true },
  { slug: "profit-loss", title: "Profit & Loss", description: "Revenue minus expenses with net profit and margin.", group: "Finance", filters: [], branchScoped: true },
  { slug: "members", title: "Member Performance", description: "Appointments, consultations, services and revenue per team member.", group: "Team & Growth", filters: ["member"], branchScoped: true },
  { slug: "referrals", title: "Referral Report", description: "Patients and revenue by referral source.", group: "Team & Growth", filters: ["referral"], branchScoped: true },
  { slug: "branches", title: "Branch Report", description: "Branch-wise comparison with a consolidated total.", group: "Team & Growth", filters: [], branchScoped: false },
  { slug: "activity", title: "Activity / Audit Report", description: "Who did what, when — across every module.", group: "Compliance", filters: ["member", "module"], branchScoped: true },
];

export function getReportDefinition(slug: string): ReportDefinition | undefined {
  return REPORT_DEFINITIONS.find((definition) => definition.slug === slug);
}

export const FILTER_LABELS: Record<ReportFilterKey, string> = {
  provider: "Provider",
  gender: "Gender",
  referral: "Referral source",
  service: "Service",
  appointmentStatus: "Status",
  paymentMethod: "Payment method",
  expenseCategory: "Category",
  member: "Member",
  module: "Module",
};

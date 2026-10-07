import dayjs from "dayjs";

import { http } from "@/lib/api/client";
import { isMockApi } from "@/lib/api/config";
import { inBranch } from "@/lib/api/mock/crud";
import { getDb } from "@/lib/api/mock/db";
import { lastMessageIndex, lastVisitIndex, toPatientRef, withAppointmentRelations, withInvoiceRelations, withPatientDetails } from "@/lib/api/mock/relations";
import { run } from "@/lib/api/mock/run";
import { isWithin, resolvePeriod, toISODate, type DateRange } from "@/lib/dates";
import { ACTIVE_APPOINTMENT_STATUSES, type DashboardSummary } from "@/types";

import type { ListScope } from "./types";

export interface DashboardService {
  getSummary(scope?: ListScope): Promise<DashboardSummary>;
}

/** Same period of last month, so partial months compare fairly. */
function lastMonthToDate(): DateRange {
  const start = dayjs().subtract(1, "month").startOf("month");
  const end = dayjs().subtract(1, "month");
  return { from: toISODate(start), to: toISODate(end.isAfter(start.endOf("month")) ? start.endOf("month") : end) };
}

function buildSummary(branchId?: string): DashboardSummary {
  const db = getDb();
  const inScope = (id: string) => inBranch(branchId, id);
  const today = toISODate(dayjs());
  const now = dayjs().format("HH:mm");
  const month = resolvePeriod("this_month");
  const monthToDate = { from: month.from, to: today };
  const previous = lastMonthToDate();

  const patients = db.patients.filter((p) => inScope(p.branchId));
  const appointments = db.appointments.filter((a) => inScope(a.branchId));
  const invoices = db.invoices.filter((i) => inScope(i.branchId));
  const expenses = db.expenses.filter((e) => inScope(e.branchId) && e.status !== "Cancelled" && !e.archived);
  const payments = invoices.flatMap((invoice) => invoice.payments.map((payment) => ({ ...payment, invoice })));
  const net = (range: DateRange) => payments.filter((p) => isWithin(p.date, range)).reduce((sum, p) => sum + (p.kind === "refund" ? -p.amount : p.amount), 0);
  const spent = (range: DateRange) => expenses.filter((e) => isWithin(e.date, range)).reduce((sum, e) => sum + e.amount, 0);
  const monthAppointments = appointments.filter((a) => isWithin(a.date, monthToDate));
  const outstanding = invoices.map((invoice) => withInvoiceRelations(invoice, new Map())).filter((i) => i.status === "Pending" || i.status === "Partially Paid");
  const months = Array.from({ length: 6 }, (_, index) => dayjs().subtract(5 - index, "month"));
  const monthRange = (m: dayjs.Dayjs) => ({ from: toISODate(m.startOf("month")), to: toISODate(m.endOf("month")) });

  const monthRecords = db.serviceRecords.filter((r) => inScope(r.branchId) && r.status === "Completed" && isWithin(r.date, monthToDate));
  const serviceTotals = new Map<string, { value: number; count: number }>();
  for (const record of monthRecords) {
    const entry = serviceTotals.get(record.serviceName) ?? { value: 0, count: 0 };
    serviceTotals.set(record.serviceName, { value: entry.value + record.amount, count: entry.count + 1 });
  }
  const methodTotals = new Map<string, number>();
  for (const p of payments.filter((p) => p.kind === "payment" && isWithin(p.date, monthToDate))) methodTotals.set(p.method, (methodTotals.get(p.method) ?? 0) + p.amount);
  const categoryTotals = new Map<string, number>();
  for (const e of expenses.filter((e) => isWithin(e.date, monthToDate))) categoryTotals.set(e.category, (categoryTotals.get(e.category) ?? 0) + e.amount);
  const toList = (map: Map<string, number>) => [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  const messages = lastMessageIndex("appointment");
  const lastVisits = lastVisitIndex();
  const revenue = net(monthToDate);
  const monthExpenses = spent(monthToDate);

  return {
    patients: {
      total: patients.length,
      active: patients.filter((p) => p.status === "Active").length,
      newThisMonth: patients.filter((p) => isWithin(p.registeredOn, monthToDate)).length,
      newPrevious: patients.filter((p) => isWithin(p.registeredOn, previous)).length,
    },
    appointments: {
      today: appointments.filter((a) => a.date === today && a.status !== "Cancelled").length,
      upcoming: appointments.filter((a) => ACTIVE_APPOINTMENT_STATUSES.includes(a.status) && a.date > today && a.date <= toISODate(dayjs().add(7, "day"))).length,
      completedThisMonth: monthAppointments.filter((a) => a.status === "Completed").length,
      cancelledThisMonth: monthAppointments.filter((a) => a.status === "Cancelled").length,
      noShowThisMonth: monthAppointments.filter((a) => a.status === "No Show").length,
    },
    todayRevenue: net({ from: today, to: today }),
    revenue: { value: revenue, previous: net(previous) },
    expenses: { value: monthExpenses, previous: spent(previous) },
    netRevenue: revenue - monthExpenses,
    pendingPayments: { amount: outstanding.reduce((sum, i) => sum + i.balance, 0), invoices: outstanding.length },
    activeServices: db.services.filter((s) => s.active).length,
    followUpsDue: db.consultations.filter((c) => inScope(c.branchId) && c.followUpDate && c.followUpDate >= today && c.followUpDate <= toISODate(dayjs().add(7, "day"))).length,
    revenueTrend: months.map((m) => {
      const r = net(monthRange(m));
      const e = spent(monthRange(m));
      return { label: m.format("MMM"), revenue: r, expenses: e, net: r - e };
    }),
    patientGrowth: months.map((m) => ({ label: m.format("MMM"), patients: patients.filter((p) => isWithin(p.registeredOn, monthRange(m))).length })),
    appointmentTrend: months.map((m) => {
      const list = appointments.filter((a) => isWithin(a.date, monthRange(m)));
      return { label: m.format("MMM"), completed: list.filter((a) => a.status === "Completed").length, cancelled: list.filter((a) => a.status === "Cancelled").length, noShow: list.filter((a) => a.status === "No Show").length };
    }),
    paymentCollection: toList(methodTotals),
    expenseOverview: toList(categoryTotals),
    servicePerformance: [...serviceTotals.entries()].map(([label, v]) => ({ label, value: v.value, count: v.count })).sort((a, b) => b.value - a.value).slice(0, 6),
    upcomingAppointments: appointments
      .filter((a) => ACTIVE_APPOINTMENT_STATUSES.includes(a.status) && (a.date > today || (a.date === today && a.endTime >= now)))
      .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
      .slice(0, 7)
      .map((a) => withAppointmentRelations(a, messages)),
    recentPatients: [...patients].sort((a, b) => b.registeredOn.localeCompare(a.registeredOn) || b.id.localeCompare(a.id)).slice(0, 5).map((p) => withPatientDetails(p, lastVisits)),
    recentPayments: payments
      .filter((p) => p.kind === "payment")
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
      .slice(0, 6)
      .map(({ invoice, ...payment }) => ({ ...payment, invoiceId: invoice.id, branchId: invoice.branchId, providerId: invoice.providerId, patient: toPatientRef(invoice.patientId) })),
    recentActivity: db.activity.filter((log) => log.branchId === null || inScope(log.branchId)).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8),
  };
}

const mockDashboardService: DashboardService = {
  getSummary: (scope) => run(() => buildSummary(scope?.branchId)),
};

const httpDashboardService: DashboardService = {
  getSummary: (scope) => http.get<DashboardSummary>("/dashboard/summary", scope),
};

export const dashboardService = isMockApi ? mockDashboardService : httpDashboardService;

import dayjs from "dayjs";

import { calculateInvoiceTotals, deriveInvoiceStatus } from "@/lib/billing";
import { bucketRange, isWithin, type DateRange } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import type { MockDatabase } from "@/mock";
import {
  ACTIVITY_MODULES,
  APPOINTMENT_STATUSES,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  REFERRAL_SOURCES,
  type Invoice,
  type ReportChart,
  type ReportFilters,
  type ReportResult,
  type ReportRow,
  type ReportSlug,
  type ReportSummaryItem,
} from "@/types";

import { FILTER_LABELS, getReportDefinition } from "./definitions";

type Body = Pick<ReportResult, "summary" | "charts" | "columns" | "rows" | "totals">;

const round = (value: number) => Math.round(value * 100) / 100;
const pct = (part: number, total: number) => (total === 0 ? 0 : Math.round((part / total) * 1000) / 10);
const sum = <T>(list: T[], pick: (item: T) => number) => round(list.reduce((total, item) => total + pick(item), 0));

function countBy<T>(list: T[], key: (item: T) => string): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of list) map.set(key(item), (map.get(key(item)) ?? 0) + 1);
  return map;
}

function sumBy<T>(list: T[], key: (item: T) => string, value: (item: T) => number): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of list) map.set(key(item), round((map.get(key(item)) ?? 0) + value(item)));
  return map;
}

function breakdown(title: string, id: string, map: Map<string, number>, format: ReportChart["format"] = "number", limit = 10): ReportChart {
  return {
    id,
    title,
    type: "breakdown",
    format,
    data: [...map.entries()].filter(([, value]) => value !== 0).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([label, value]) => ({ label, value })),
    series: [{ key: "value", label: title }],
  };
}

function summaryItem(label: string, value: number, format: ReportSummaryItem["format"] = "number", hint?: string): ReportSummaryItem {
  return { label, value, format, hint };
}

/** Pre-filters every collection by date range, branch and the report's filters. */
function scoped(db: MockDatabase, filters: ReportFilters) {
  const range: DateRange = { from: filters.from, to: filters.to };
  const branch = (branchId: string) => filters.branchId === "all" || !filters.branchId || filters.branchId === branchId;
  const provider = (providerId: string) => !filters.provider || filters.provider === providerId;
  const member = (id: string) => db.members.find((m) => m.id === id)?.name ?? "—";
  const patientName = (id: string) => {
    const p = db.patients.find((item) => item.id === id);
    return p ? [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ") : id;
  };
  const serviceName = (id: string | null) => (id ? (db.services.find((s) => s.id === id)?.name ?? "—") : "—");
  const branchName = (id: string) => db.branches.find((b) => b.id === id)?.name ?? "—";

  const payments = db.invoices
    .filter((invoice) => branch(invoice.branchId) && provider(invoice.providerId))
    .flatMap((invoice) => invoice.payments.map((payment) => ({ ...payment, invoice })))
    .filter((payment) => isWithin(payment.date, range));
  const signed = (p: { kind: string; amount: number }) => (p.kind === "refund" ? -p.amount : p.amount);

  return {
    range,
    branch,
    provider,
    member,
    patientName,
    serviceName,
    branchName,
    signed,
    payments,
    appointments: db.appointments.filter((a) => isWithin(a.date, range) && branch(a.branchId) && provider(a.providerId)),
    consultations: db.consultations.filter((c) => isWithin(c.date, range) && branch(c.branchId) && provider(c.providerId)),
    services: db.serviceRecords.filter((s) => isWithin(s.date, range) && branch(s.branchId) && provider(s.providerId)),
    invoices: db.invoices.filter((i) => isWithin(i.invoiceDate, range) && branch(i.branchId) && provider(i.providerId)),
    expenses: db.expenses.filter((e) => isWithin(e.date, range) && branch(e.branchId) && !e.archived && e.status !== "Cancelled"),
    newPatients: db.patients.filter((p) => isWithin(p.registeredOn, range) && branch(p.branchId) && provider(p.primaryProviderId)),
  };
}

type Scope = ReturnType<typeof scoped>;

function dailyReport(db: MockDatabase, s: Scope): Body {
  const days: string[] = [];
  for (let d = dayjs(s.range.from); !d.isAfter(dayjs(s.range.to)); d = d.add(1, "day")) days.push(d.format("YYYY-MM-DD"));
  const rows: ReportRow[] = days.map((date) => {
    const appts = s.appointments.filter((a) => a.date === date);
    const collected = sum(s.payments.filter((p) => p.date === date), s.signed);
    const spent = sum(s.expenses.filter((e) => e.date === date), (e) => e.amount);
    return {
      date,
      patients: new Set(appts.filter((a) => a.status === "Completed").map((a) => a.patientId)).size,
      newPatients: s.newPatients.filter((p) => p.registeredOn === date).length,
      appointments: appts.length,
      completed: appts.filter((a) => a.status === "Completed").length,
      cancelled: appts.filter((a) => a.status === "Cancelled").length,
      noShows: appts.filter((a) => a.status === "No Show").length,
      consultations: s.consultations.filter((c) => c.date === date).length,
      services: s.services.filter((r) => r.date === date && r.status === "Completed").length,
      payments: collected,
      expenses: spent,
      net: round(collected - spent),
    };
  });
  const total = (key: string) => sum(rows, (row) => Number(row[key]) || 0);
  const totals: ReportRow = { date: "Total", ...Object.fromEntries(["patients", "newPatients", "appointments", "completed", "cancelled", "noShows", "consultations", "services", "payments", "expenses", "net"].map((key) => [key, total(key)])) };
  return {
    summary: [
      summaryItem("Patients seen", new Set(s.appointments.filter((a) => a.status === "Completed").map((a) => a.patientId)).size),
      summaryItem("New patients", s.newPatients.length),
      summaryItem("Appointments", s.appointments.length),
      summaryItem("Completed", total("completed")),
      summaryItem("Cancelled", total("cancelled")),
      summaryItem("No shows", total("noShows")),
      summaryItem("Consultations", s.consultations.length),
      summaryItem("Services delivered", total("services")),
      summaryItem("Payments", total("payments"), "currency"),
      summaryItem("Expenses", total("expenses"), "currency"),
      summaryItem("Net revenue", total("net"), "currency"),
    ],
    charts: [
      {
        id: "finance",
        title: "Collections vs expenses",
        type: "bar",
        format: "currency",
        data: rows.map((row) => ({ label: formatDate(String(row.date), "DD MMM"), payments: Number(row.payments), expenses: Number(row.expenses) })),
        series: [
          { key: "payments", label: "Payments" },
          { key: "expenses", label: "Expenses" },
        ],
      },
      {
        id: "visits",
        title: "Appointments by outcome",
        type: "bar",
        format: "number",
        data: rows.map((row) => ({ label: formatDate(String(row.date), "DD MMM"), completed: Number(row.completed), cancelled: Number(row.cancelled), noShows: Number(row.noShows) })),
        series: [
          { key: "completed", label: "Completed" },
          { key: "cancelled", label: "Cancelled" },
          { key: "noShows", label: "No show" },
        ],
      },
    ],
    columns: [
      { key: "date", label: "Date", format: "date" },
      { key: "patients", label: "Patients", align: "right" },
      { key: "newPatients", label: "New", align: "right" },
      { key: "appointments", label: "Appts", align: "right" },
      { key: "completed", label: "Completed", align: "right" },
      { key: "cancelled", label: "Cancelled", align: "right" },
      { key: "noShows", label: "No show", align: "right" },
      { key: "consultations", label: "Consults", align: "right" },
      { key: "services", label: "Services", align: "right" },
      { key: "payments", label: "Payments", format: "currency", align: "right" },
      { key: "expenses", label: "Expenses", format: "currency", align: "right" },
      { key: "net", label: "Net", format: "currency", align: "right" },
    ],
    rows: rows.reverse(),
    totals,
  };
}

function patientReport(db: MockDatabase, s: Scope, filters: ReportFilters): Body {
  const match = (p: MockDatabase["patients"][number]) =>
    (!filters.gender || p.gender === filters.gender) && (!filters.referral || p.referral.source === filters.referral);
  const fresh = s.newPatients.filter(match);
  const visitedIds = new Set(s.appointments.filter((a) => a.status === "Completed").map((a) => a.patientId));
  const branchPatients = db.patients.filter((p) => s.branch(p.branchId) && s.provider(p.primaryProviderId) && match(p) && p.registeredOn <= s.range.to);
  const returning = branchPatients.filter((p) => p.registeredOn < s.range.from && visitedIds.has(p.id));
  const age = (dob: string) => dayjs().diff(dayjs(dob), "year");
  const ageGroup = (years: number) => (years < 18 ? "Under 18" : years < 30 ? "18–29" : years < 45 ? "30–44" : years < 60 ? "45–59" : "60+");
  const buckets = bucketRange(s.range);
  return {
    summary: [
      summaryItem("Total patients", branchPatients.length, "number", `as of ${formatDate(s.range.to)}`),
      summaryItem("New patients", fresh.length),
      summaryItem("Returning patients", returning.length),
      summaryItem("Active", branchPatients.filter((p) => p.status === "Active").length),
      summaryItem("Inactive / discharged", branchPatients.filter((p) => p.status !== "Active").length),
    ],
    charts: [
      { id: "trend", title: "New registrations", type: "bar", format: "number", data: buckets.map((b) => ({ label: b.label, patients: fresh.filter((p) => isWithin(p.registeredOn, b)).length })), series: [{ key: "patients", label: "New patients" }] },
      breakdown("Gender", "gender", countBy(fresh, (p) => p.gender)),
      breakdown("Age groups", "age", countBy(fresh, (p) => ageGroup(age(p.dateOfBirth)))),
      breakdown("Referral sources", "referral", countBy(fresh, (p) => p.referral.source)),
    ],
    columns: [
      { key: "id", label: "Patient ID" },
      { key: "name", label: "Name" },
      { key: "gender", label: "Gender" },
      { key: "age", label: "Age", align: "right" },
      { key: "phone", label: "Mobile" },
      { key: "referral", label: "Referral" },
      { key: "provider", label: "Provider" },
      { key: "branch", label: "Branch" },
      { key: "registeredOn", label: "Registered", format: "date" },
      { key: "status", label: "Status" },
    ],
    rows: fresh
      .sort((a, b) => b.registeredOn.localeCompare(a.registeredOn))
      .map((p) => ({
        id: p.id,
        name: s.patientName(p.id),
        gender: p.gender,
        age: age(p.dateOfBirth),
        phone: p.phone,
        referral: p.referral.source,
        provider: s.member(p.primaryProviderId),
        branch: s.branchName(p.branchId),
        registeredOn: p.registeredOn,
        status: p.status,
      })),
    totals: null,
  };
}

function appointmentReport(db: MockDatabase, s: Scope, filters: ReportFilters): Body {
  const list = s.appointments.filter((a) => (!filters.service || a.serviceId === filters.service) && (!filters.appointmentStatus || a.status === filters.appointmentStatus));
  const byStatus = countBy(list, (a) => a.status);
  const buckets = bucketRange(s.range);
  return {
    summary: [
      summaryItem("Total appointments", list.length),
      ...APPOINTMENT_STATUSES.filter((status) => status !== "Checked In" && status !== "In Consultation").map((status) => summaryItem(status, byStatus.get(status) ?? 0)),
      summaryItem("Completion rate", pct(byStatus.get("Completed") ?? 0, list.filter((a) => ["Completed", "Cancelled", "No Show"].includes(a.status)).length), "percent"),
    ],
    charts: [
      {
        id: "trend",
        title: "Date-wise appointments",
        type: "bar",
        format: "number",
        data: buckets.map((b) => {
          const inBucket = list.filter((a) => isWithin(a.date, b));
          return { label: b.label, completed: inBucket.filter((a) => a.status === "Completed").length, cancelled: inBucket.filter((a) => a.status === "Cancelled").length, noShow: inBucket.filter((a) => a.status === "No Show").length };
        }),
        series: [
          { key: "completed", label: "Completed" },
          { key: "cancelled", label: "Cancelled" },
          { key: "noShow", label: "No show" },
        ],
      },
      breakdown("Provider-wise", "provider", countBy(list, (a) => s.member(a.providerId))),
      breakdown("Service-wise", "service", countBy(list, (a) => s.serviceName(a.serviceId))),
      breakdown("By status", "status", byStatus),
    ],
    columns: [
      { key: "id", label: "Appointment" },
      { key: "date", label: "Date", format: "date" },
      { key: "time", label: "Time" },
      { key: "patient", label: "Patient" },
      { key: "provider", label: "Provider" },
      { key: "service", label: "Service" },
      { key: "type", label: "Type" },
      { key: "branch", label: "Branch" },
      { key: "status", label: "Status" },
    ],
    rows: [...list]
      .sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`))
      .map((a) => ({ id: a.id, date: a.date, time: `${a.startTime}–${a.endTime}`, patient: s.patientName(a.patientId), provider: s.member(a.providerId), service: s.serviceName(a.serviceId), type: a.type, branch: s.branchName(a.branchId), status: a.status })),
    totals: null,
  };
}

function consultationReport(db: MockDatabase, s: Scope): Body {
  const list = s.consultations;
  const converted = list.filter((c) => c.visitType === "New" && db.serviceRecords.some((r) => r.consultationId === c.id && r.status === "Completed"));
  const newOnes = list.filter((c) => c.visitType === "New");
  const buckets = bucketRange(s.range);
  return {
    summary: [
      summaryItem("Total consultations", list.length),
      summaryItem("New", newOnes.length),
      summaryItem("Follow-up", list.length - newOnes.length),
      summaryItem("Conversion to services", pct(converted.length, newOnes.length), "percent", "new consultations followed by ≥1 completed service"),
      summaryItem("Providers", new Set(list.map((c) => c.providerId)).size),
    ],
    charts: [
      {
        id: "trend",
        title: "Date-wise consultations",
        type: "bar",
        format: "number",
        data: buckets.map((b) => {
          const inBucket = list.filter((c) => isWithin(c.date, b));
          return { label: b.label, new: inBucket.filter((c) => c.visitType === "New").length, followUp: inBucket.filter((c) => c.visitType === "Follow-up").length };
        }),
        series: [
          { key: "new", label: "New" },
          { key: "followUp", label: "Follow-up" },
        ],
      },
      breakdown("Provider-wise", "provider", countBy(list, (c) => s.member(c.providerId))),
      breakdown("Diagnoses", "diagnosis", countBy(list, (c) => c.diagnosis), "number", 8),
    ],
    columns: [
      { key: "id", label: "Consultation" },
      { key: "date", label: "Date", format: "date" },
      { key: "patient", label: "Patient" },
      { key: "provider", label: "Provider" },
      { key: "visitType", label: "Visit" },
      { key: "diagnosis", label: "Diagnosis" },
      { key: "plannedSessions", label: "Planned", align: "right" },
      { key: "followUp", label: "Follow-up", format: "date" },
    ],
    rows: [...list]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((c) => ({ id: c.id, date: c.date, patient: s.patientName(c.patientId), provider: s.member(c.providerId), visitType: c.visitType, diagnosis: c.diagnosis, plannedSessions: c.plannedSessions, followUp: c.followUpDate })),
    totals: null,
  };
}

function serviceReport(db: MockDatabase, s: Scope, filters: ReportFilters): Body {
  const list = s.services.filter((r) => !filters.service || r.serviceId === filters.service);
  const completed = list.filter((r) => r.status === "Completed");
  const buckets = bucketRange(s.range);
  return {
    summary: [
      summaryItem("Total services", list.length),
      summaryItem("Completed", completed.length),
      summaryItem("Cancelled", list.filter((r) => r.status === "Cancelled").length),
      summaryItem("Scheduled / in progress", list.filter((r) => r.status === "Scheduled" || r.status === "In Progress").length),
      summaryItem("Service value", sum(completed, (r) => r.amount), "currency", "completed services"),
    ],
    charts: [
      { id: "trend", title: "Date-wise completed services", type: "bar", format: "number", data: buckets.map((b) => ({ label: b.label, services: completed.filter((r) => isWithin(r.date, b)).length })), series: [{ key: "services", label: "Completed services" }] },
      breakdown("Service-wise count", "count", countBy(completed, (r) => r.serviceName)),
      breakdown("Revenue by service", "revenue", sumBy(completed, (r) => r.serviceName, (r) => r.amount), "currency"),
      breakdown("Provider-wise", "provider", countBy(completed, (r) => s.member(r.providerId))),
    ],
    columns: [
      { key: "id", label: "Record" },
      { key: "date", label: "Date", format: "date" },
      { key: "patient", label: "Patient" },
      { key: "service", label: "Service" },
      { key: "session", label: "Session" },
      { key: "provider", label: "Provider" },
      { key: "status", label: "Status" },
      { key: "amount", label: "Amount", format: "currency", align: "right" },
    ],
    rows: [...list]
      .sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`))
      .map((r) => ({ id: r.id, date: r.date, patient: s.patientName(r.patientId), service: r.serviceName, session: `${r.sessionNumber}/${r.totalSessions}`, provider: s.member(r.providerId), status: r.status, amount: r.amount })),
    totals: { id: "Total", amount: sum(list, (r) => r.amount) },
  };
}

function paymentReport(db: MockDatabase, s: Scope, filters: ReportFilters): Body {
  const list = s.payments.filter((p) => !filters.paymentMethod || p.method === filters.paymentMethod);
  const received = list.filter((p) => p.kind === "payment");
  const refunds = list.filter((p) => p.kind === "refund");
  const byMethod = sumBy(received, (p) => p.method, (p) => p.amount);
  const statuses = s.invoices.map((invoice) => ({ invoice, totals: calculateInvoiceTotals(invoice) })).map((x) => ({ ...x, status: deriveInvoiceStatus(x.invoice.cancelled, x.totals) }));
  const buckets = bucketRange(s.range);
  return {
    summary: [
      summaryItem("Total collections", round(sum(received, (p) => p.amount) - sum(refunds, (p) => p.amount)), "currency", "net of refunds"),
      ...PAYMENT_METHODS.map((method) => summaryItem(method, byMethod.get(method) ?? 0, "currency")),
      summaryItem("Refunded", sum(refunds, (p) => p.amount), "currency"),
      summaryItem("Pending", sum(statuses.filter((x) => x.status === "Pending"), (x) => x.totals.balance), "currency", "on invoices raised in period"),
      summaryItem("Partially paid", sum(statuses.filter((x) => x.status === "Partially Paid"), (x) => x.totals.balance), "currency", "balance due"),
    ],
    charts: [
      { id: "trend", title: "Collections", type: "bar", format: "currency", data: buckets.map((b) => ({ label: b.label, collected: sum(list.filter((p) => isWithin(p.date, b)), s.signed) })), series: [{ key: "collected", label: "Net collections" }] },
      breakdown("By payment method", "method", byMethod, "currency"),
    ],
    columns: [
      { key: "receipt", label: "Receipt / CN" },
      { key: "date", label: "Date", format: "date" },
      { key: "invoice", label: "Invoice" },
      { key: "patient", label: "Patient" },
      { key: "method", label: "Method" },
      { key: "kind", label: "Type" },
      { key: "reference", label: "Reference" },
      { key: "amount", label: "Amount", format: "currency", align: "right" },
    ],
    rows: [...list]
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
      .map((p) => ({ receipt: p.receiptNumber, date: p.date, invoice: p.invoice.id, patient: s.patientName(p.invoice.patientId), method: p.method, kind: p.kind === "refund" ? "Refund" : "Payment", reference: p.reference, amount: s.signed(p) })),
    totals: { receipt: "Net total", amount: sum(list, s.signed) },
  };
}

function revenueReport(db: MockDatabase, s: Scope, filters: ReportFilters): Body {
  const buckets = bucketRange(s.range);
  const invoices = s.invoices.filter((invoice) => !invoice.cancelled);
  const invoiced = (list: Invoice[]) => sum(list, (invoice) => calculateInvoiceTotals(invoice).total);
  const rows: ReportRow[] = buckets.map((b) => {
    const pays = s.payments.filter((p) => isWithin(p.date, b));
    const refunds = sum(pays.filter((p) => p.kind === "refund"), (p) => p.amount);
    const collected = sum(pays.filter((p) => p.kind === "payment"), (p) => p.amount);
    return { period: b.label, invoiced: invoiced(invoices.filter((i) => isWithin(i.invoiceDate, b))), collected, refunds, net: round(collected - refunds) };
  });
  const items = invoices.flatMap((invoice) => invoice.items.map((item) => ({ ...item, invoice }))).filter((item) => !filters.service || item.serviceId === filters.service);
  const net = sum(rows, (row) => Number(row.net));
  const days = dayjs(s.range.to).diff(dayjs(s.range.from), "day") + 1;
  return {
    summary: [
      summaryItem("Net revenue", net, "currency"),
      summaryItem("Average daily", round(net / days), "currency"),
      summaryItem("Average weekly", round((net / days) * 7), "currency"),
      summaryItem("Average monthly", round((net / days) * 30), "currency"),
      summaryItem("Invoiced", sum(rows, (row) => Number(row.invoiced)), "currency"),
      summaryItem("Refunds", sum(rows, (row) => Number(row.refunds)), "currency"),
    ],
    charts: [
      { id: "trend", title: "Revenue trend", type: "line", format: "currency", data: rows.map((row) => ({ label: String(row.period), net: Number(row.net), invoiced: Number(row.invoiced) })), series: [{ key: "net", label: "Net collected" }, { key: "invoiced", label: "Invoiced" }] },
      breakdown("Revenue by service (invoiced)", "service", sumBy(items, (item) => s.serviceName(item.serviceId) === "—" ? item.description : s.serviceName(item.serviceId), (item) => item.quantity * item.unitPrice), "currency"),
      breakdown("Revenue by provider", "provider", sumBy(s.payments, (p) => s.member(p.invoice.providerId), s.signed), "currency"),
      breakdown("Revenue by branch", "branch", sumBy(s.payments, (p) => s.branchName(p.invoice.branchId), s.signed), "currency"),
    ],
    columns: [
      { key: "period", label: "Period" },
      { key: "invoiced", label: "Invoiced", format: "currency", align: "right" },
      { key: "collected", label: "Collected", format: "currency", align: "right" },
      { key: "refunds", label: "Refunds", format: "currency", align: "right" },
      { key: "net", label: "Net revenue", format: "currency", align: "right" },
    ],
    rows,
    totals: { period: "Total", invoiced: sum(rows, (r) => Number(r.invoiced)), collected: sum(rows, (r) => Number(r.collected)), refunds: sum(rows, (r) => Number(r.refunds)), net },
  };
}

function expenseReport(db: MockDatabase, s: Scope, filters: ReportFilters): Body {
  const list = s.expenses.filter((e) => (!filters.expenseCategory || e.category === filters.expenseCategory) && (!filters.paymentMethod || e.paymentMethod === filters.paymentMethod));
  const buckets = bucketRange(s.range);
  const months = Math.max(1, dayjs(s.range.to).diff(dayjs(s.range.from), "month", true));
  return {
    summary: [
      summaryItem("Total expenses", sum(list, (e) => e.amount), "currency"),
      summaryItem("Paid", sum(list.filter((e) => e.status === "Paid"), (e) => e.amount), "currency"),
      summaryItem("Pending", sum(list.filter((e) => e.status === "Pending"), (e) => e.amount), "currency"),
      summaryItem("Entries", list.length),
      summaryItem("Monthly average", round(sum(list, (e) => e.amount) / months), "currency"),
    ],
    charts: [
      { id: "trend", title: "Expense trend", type: "bar", format: "currency", data: buckets.map((b) => ({ label: b.label, expenses: sum(list.filter((e) => isWithin(e.date, b)), (e) => e.amount) })), series: [{ key: "expenses", label: "Expenses" }] },
      breakdown("Category-wise", "category", sumBy(list, (e) => e.category, (e) => e.amount), "currency", EXPENSE_CATEGORIES.length),
      breakdown("Branch-wise", "branch", sumBy(list, (e) => s.branchName(e.branchId), (e) => e.amount), "currency"),
    ],
    columns: [
      { key: "id", label: "Expense" },
      { key: "date", label: "Date", format: "date" },
      { key: "category", label: "Category" },
      { key: "description", label: "Description" },
      { key: "vendor", label: "Vendor" },
      { key: "branch", label: "Branch" },
      { key: "method", label: "Method" },
      { key: "status", label: "Status" },
      { key: "amount", label: "Amount", format: "currency", align: "right" },
    ],
    rows: [...list]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((e) => ({ id: e.id, date: e.date, category: e.category, description: e.description, vendor: e.vendor, branch: s.branchName(e.branchId), method: e.paymentMethod, status: e.status, amount: e.amount })),
    totals: { id: "Total", amount: sum(list, (e) => e.amount) },
  };
}

function profitLossReport(db: MockDatabase, s: Scope): Body {
  const buckets = bucketRange(s.range);
  const rows: ReportRow[] = buckets.map((b) => {
    const revenue = sum(s.payments.filter((p) => isWithin(p.date, b)), s.signed);
    const expenses = sum(s.expenses.filter((e) => isWithin(e.date, b)), (e) => e.amount);
    return { period: b.label, revenue, expenses, profit: round(revenue - expenses), margin: pct(revenue - expenses, revenue) };
  });
  const revenue = sum(rows, (r) => Number(r.revenue));
  const expenses = sum(rows, (r) => Number(r.expenses));
  return {
    summary: [
      summaryItem("Gross revenue", revenue, "currency", "collections net of refunds"),
      summaryItem("Total expenses", expenses, "currency"),
      summaryItem("Net profit", round(revenue - expenses), "currency"),
      summaryItem("Profit margin", pct(revenue - expenses, revenue), "percent"),
    ],
    charts: [
      { id: "pl", title: "Revenue vs expenses", type: "bar", format: "currency", data: rows.map((r) => ({ label: String(r.period), revenue: Number(r.revenue), expenses: Number(r.expenses) })), series: [{ key: "revenue", label: "Revenue" }, { key: "expenses", label: "Expenses" }] },
      { id: "profit", title: "Net profit", type: "line", format: "currency", data: rows.map((r) => ({ label: String(r.period), profit: Number(r.profit) })), series: [{ key: "profit", label: "Net profit" }] },
      breakdown("Expenses by category", "categories", sumBy(s.expenses, (e) => e.category, (e) => e.amount), "currency"),
    ],
    columns: [
      { key: "period", label: "Period" },
      { key: "revenue", label: "Revenue", format: "currency", align: "right" },
      { key: "expenses", label: "Expenses", format: "currency", align: "right" },
      { key: "profit", label: "Net profit", format: "currency", align: "right" },
      { key: "margin", label: "Margin", format: "percent", align: "right" },
    ],
    rows,
    totals: { period: "Total", revenue, expenses, profit: round(revenue - expenses), margin: pct(revenue - expenses, revenue) },
  };
}

function memberReport(db: MockDatabase, s: Scope, filters: ReportFilters): Body {
  const members = db.members.filter((m) => m.status !== "Invited" && (!filters.member || m.id === filters.member) && (filters.branchId === "all" || m.branchIds.includes(filters.branchId)));
  const activity = db.activity.filter((log) => isWithin(log.at.slice(0, 10), s.range) && (log.branchId === null || s.branch(log.branchId)));
  const rows: ReportRow[] = members.map((m) => {
    const appts = s.appointments.filter((a) => a.providerId === m.id);
    return {
      member: m.name,
      role: m.role,
      appointments: appts.length,
      completed: appts.filter((a) => a.status === "Completed").length,
      consultations: s.consultations.filter((c) => c.providerId === m.id).length,
      services: s.services.filter((r) => r.providerId === m.id && r.status === "Completed").length,
      revenue: sum(s.payments.filter((p) => p.invoice.providerId === m.id), s.signed),
      activity: activity.filter((log) => log.memberId === m.id).length,
    };
  });
  return {
    summary: [
      summaryItem("Members", members.length),
      summaryItem("Providers", members.filter((m) => m.isProvider).length),
      summaryItem("Appointments handled", sum(rows, (r) => Number(r.appointments))),
      summaryItem("Revenue contribution", sum(rows, (r) => Number(r.revenue)), "currency"),
      summaryItem("Recorded actions", sum(rows, (r) => Number(r.activity))),
    ],
    charts: [
      breakdown("Revenue contribution", "revenue", new Map(rows.map((r) => [String(r.member), Number(r.revenue)])), "currency"),
      breakdown("Completed services", "services", new Map(rows.map((r) => [String(r.member), Number(r.services)]))),
      breakdown("Activity count", "activity", new Map(rows.map((r) => [String(r.member), Number(r.activity)]))),
    ],
    columns: [
      { key: "member", label: "Member" },
      { key: "role", label: "Role" },
      { key: "appointments", label: "Appointments", align: "right" },
      { key: "completed", label: "Completed", align: "right" },
      { key: "consultations", label: "Consultations", align: "right" },
      { key: "services", label: "Services", align: "right" },
      { key: "revenue", label: "Revenue", format: "currency", align: "right" },
      { key: "activity", label: "Actions", align: "right" },
    ],
    rows: rows.sort((a, b) => Number(b.revenue) - Number(a.revenue)),
    totals: { member: "Total", appointments: sum(rows, (r) => Number(r.appointments)), completed: sum(rows, (r) => Number(r.completed)), consultations: sum(rows, (r) => Number(r.consultations)), services: sum(rows, (r) => Number(r.services)), revenue: sum(rows, (r) => Number(r.revenue)), activity: sum(rows, (r) => Number(r.activity)) },
  };
}

function referralReport(db: MockDatabase, s: Scope, filters: ReportFilters): Body {
  const patients = s.newPatients.filter((p) => !filters.referral || p.referral.source === filters.referral);
  const revenueByPatient = sumBy(
    db.invoices.filter((i) => s.branch(i.branchId)).flatMap((invoice) => invoice.payments.map((p) => ({ p, patientId: invoice.patientId }))),
    (x) => x.patientId,
    (x) => s.signed(x.p),
  );
  const servedIds = new Set(db.serviceRecords.filter((r) => r.status === "Completed").map((r) => r.patientId));
  const rows: ReportRow[] = REFERRAL_SOURCES.map((source) => {
    const group = patients.filter((p) => p.referral.source === source);
    return {
      source,
      patients: group.length,
      active: group.filter((p) => p.status === "Active").length,
      converted: group.filter((p) => servedIds.has(p.id)).length,
      conversion: pct(group.filter((p) => servedIds.has(p.id)).length, group.length),
      revenue: sum(group, (p) => revenueByPatient.get(p.id) ?? 0),
    };
  }).filter((row) => Number(row.patients) > 0);
  const top = [...rows].sort((a, b) => Number(b.patients) - Number(a.patients))[0];
  return {
    summary: [
      summaryItem("New patients", patients.length),
      summaryItem("Sources", rows.length),
      summaryItem("Revenue contribution", sum(rows, (r) => Number(r.revenue)), "currency", "lifetime collections from these patients"),
      summaryItem("Overall conversion", pct(sum(rows, (r) => Number(r.converted)), patients.length), "percent", top ? `top source: ${top.source}` : undefined),
    ],
    charts: [
      breakdown("Patients by source", "patients", new Map(rows.map((r) => [String(r.source), Number(r.patients)]))),
      breakdown("Revenue by source", "revenue", new Map(rows.map((r) => [String(r.source), Number(r.revenue)])), "currency"),
    ],
    columns: [
      { key: "source", label: "Referral source" },
      { key: "patients", label: "Patients", align: "right" },
      { key: "active", label: "Active", align: "right" },
      { key: "converted", label: "Converted", align: "right" },
      { key: "conversion", label: "Conversion", format: "percent", align: "right" },
      { key: "revenue", label: "Revenue", format: "currency", align: "right" },
    ],
    rows: rows.sort((a, b) => Number(b.patients) - Number(a.patients)),
    totals: { source: "Total", patients: patients.length, active: sum(rows, (r) => Number(r.active)), converted: sum(rows, (r) => Number(r.converted)), revenue: sum(rows, (r) => Number(r.revenue)) },
  };
}

function branchReport(db: MockDatabase, s: Scope): Body {
  const rows: ReportRow[] = db.branches.map((branch) => {
    const revenue = sum(s.payments.filter((p) => p.invoice.branchId === branch.id), s.signed);
    const expenses = sum(s.expenses.filter((e) => e.branchId === branch.id), (e) => e.amount);
    return {
      branch: branch.name,
      patients: s.newPatients.filter((p) => p.branchId === branch.id).length,
      appointments: s.appointments.filter((a) => a.branchId === branch.id).length,
      services: s.services.filter((r) => r.branchId === branch.id && r.status === "Completed").length,
      revenue,
      expenses,
      net: round(revenue - expenses),
    };
  });
  const total = (key: string) => sum(rows, (r) => Number(r[key]));
  return {
    summary: [
      summaryItem("Branches", db.branches.filter((b) => b.active).length),
      summaryItem("New patients", total("patients")),
      summaryItem("Appointments", total("appointments")),
      summaryItem("Consolidated revenue", total("revenue"), "currency"),
      summaryItem("Consolidated expenses", total("expenses"), "currency"),
      summaryItem("Consolidated net", total("net"), "currency"),
    ],
    charts: [
      { id: "compare", title: "Branch comparison", type: "bar", format: "currency", data: rows.map((r) => ({ label: String(r.branch), revenue: Number(r.revenue), expenses: Number(r.expenses), net: Number(r.net) })), series: [{ key: "revenue", label: "Revenue" }, { key: "expenses", label: "Expenses" }, { key: "net", label: "Net" }] },
      breakdown("Appointments by branch", "appointments", new Map(rows.map((r) => [String(r.branch), Number(r.appointments)]))),
    ],
    columns: [
      { key: "branch", label: "Branch" },
      { key: "patients", label: "New patients", align: "right" },
      { key: "appointments", label: "Appointments", align: "right" },
      { key: "services", label: "Services", align: "right" },
      { key: "revenue", label: "Revenue", format: "currency", align: "right" },
      { key: "expenses", label: "Expenses", format: "currency", align: "right" },
      { key: "net", label: "Net revenue", format: "currency", align: "right" },
    ],
    rows,
    totals: { branch: "Consolidated", patients: total("patients"), appointments: total("appointments"), services: total("services"), revenue: total("revenue"), expenses: total("expenses"), net: total("net") },
  };
}

function outstandingReport(db: MockDatabase, s: Scope): Body {
  const today = dayjs().format("YYYY-MM-DD");
  const list = s.invoices
    .map((invoice) => ({ invoice, totals: calculateInvoiceTotals(invoice), status: deriveInvoiceStatus(invoice.cancelled, calculateInvoiceTotals(invoice)) }))
    .filter((x) => x.totals.balance > 0 && x.status !== "Cancelled" && x.status !== "Refunded")
    .map((x) => ({ ...x, overdue: Math.max(0, dayjs(today).diff(dayjs(x.invoice.dueDate), "day")) }));
  const aging = new Map<string, number>([["Not yet due", 0], ["1–30 days", 0], ["31–60 days", 0], ["60+ days", 0]]);
  for (const x of list) {
    const key = x.overdue === 0 ? "Not yet due" : x.overdue <= 30 ? "1–30 days" : x.overdue <= 60 ? "31–60 days" : "60+ days";
    aging.set(key, round((aging.get(key) ?? 0) + x.totals.balance));
  }
  const overdue = list.filter((x) => x.overdue > 0);
  return {
    summary: [
      summaryItem("Total outstanding", sum(list, (x) => x.totals.balance), "currency"),
      summaryItem("Invoices", list.length),
      summaryItem("Overdue amount", sum(overdue, (x) => x.totals.balance), "currency"),
      summaryItem("Overdue invoices", overdue.length),
      summaryItem("Over 30 days", list.filter((x) => x.overdue > 30).length),
    ],
    charts: [{ ...breakdown("Ageing", "aging", aging, "currency"), data: [...aging.entries()].map(([label, value]) => ({ label, value })) }],
    columns: [
      { key: "invoice", label: "Invoice" },
      { key: "patient", label: "Patient" },
      { key: "phone", label: "Mobile" },
      { key: "invoiceDate", label: "Invoice date", format: "date" },
      { key: "dueDate", label: "Due date", format: "date" },
      { key: "total", label: "Total", format: "currency", align: "right" },
      { key: "paid", label: "Paid", format: "currency", align: "right" },
      { key: "pending", label: "Pending", format: "currency", align: "right" },
      { key: "overdue", label: "Days overdue", align: "right" },
      { key: "status", label: "Status" },
    ],
    rows: list
      .sort((a, b) => b.overdue - a.overdue)
      .map((x) => ({
        invoice: x.invoice.id,
        patient: s.patientName(x.invoice.patientId),
        phone: db.patients.find((p) => p.id === x.invoice.patientId)?.phone ?? "",
        invoiceDate: x.invoice.invoiceDate,
        dueDate: x.invoice.dueDate,
        total: x.totals.total,
        paid: x.totals.paid,
        pending: x.totals.balance,
        overdue: x.overdue,
        status: x.status,
      })),
    totals: { invoice: "Total", total: sum(list, (x) => x.totals.total), paid: sum(list, (x) => x.totals.paid), pending: sum(list, (x) => x.totals.balance) },
  };
}

function activityReport(db: MockDatabase, s: Scope, filters: ReportFilters): Body {
  const list = db.activity
    .filter((log) => isWithin(log.at.slice(0, 10), s.range) && (log.branchId === null || s.branch(log.branchId)))
    .filter((log) => (!filters.member || log.memberId === filters.member) && (!filters.module || log.module === filters.module));
  const buckets = bucketRange(s.range);
  return {
    summary: [
      summaryItem("Total actions", list.length),
      summaryItem("Active members", new Set(list.map((log) => log.memberId)).size),
      summaryItem("Modules touched", new Set(list.map((log) => log.module)).size),
      summaryItem("Deletions", list.filter((log) => log.action === "deleted").length),
    ],
    charts: [
      { id: "trend", title: "Actions over time", type: "bar", format: "number", data: buckets.map((b) => ({ label: b.label, actions: list.filter((log) => isWithin(log.at.slice(0, 10), b)).length })), series: [{ key: "actions", label: "Actions" }] },
      breakdown("By module", "module", countBy(list, (log) => log.module), "number", ACTIVITY_MODULES.length),
      breakdown("By member", "member", countBy(list, (log) => log.memberName)),
    ],
    columns: [
      { key: "at", label: "Date & time", format: "datetime" },
      { key: "member", label: "Member" },
      { key: "action", label: "Action" },
      { key: "module", label: "Module" },
      { key: "record", label: "Record" },
      { key: "description", label: "Description" },
    ],
    rows: [...list]
      .sort((a, b) => b.at.localeCompare(a.at))
      .map((log) => ({ at: log.at, member: log.memberName, action: log.action.replace("_", " "), module: log.module, record: log.recordId, description: log.description })),
    totals: null,
  };
}

function appliedFilters(db: MockDatabase, filters: ReportFilters, branchScoped: boolean): ReportResult["appliedFilters"] {
  const applied = [
    { label: "Period", value: `${formatDate(filters.from)} – ${formatDate(filters.to)}` },
    { label: "Branch", value: !branchScoped || filters.branchId === "all" ? "All branches (consolidated)" : (db.branches.find((b) => b.id === filters.branchId)?.name ?? filters.branchId) },
  ];
  const resolve: Partial<Record<keyof ReportFilters, (value: string) => string>> = {
    provider: (v) => db.members.find((m) => m.id === v)?.name ?? v,
    member: (v) => db.members.find((m) => m.id === v)?.name ?? v,
    service: (v) => db.services.find((s) => s.id === v)?.name ?? v,
  };
  (Object.keys(FILTER_LABELS) as (keyof typeof FILTER_LABELS)[]).forEach((key) => {
    const value = filters[key];
    if (value) applied.push({ label: FILTER_LABELS[key], value: resolve[key]?.(value) ?? value });
  });
  return applied;
}

/** Computes any report from the shared dataset. The backend will expose the same contract. */
export function computeReport(db: MockDatabase, slug: ReportSlug, filters: ReportFilters): ReportResult {
  const definition = getReportDefinition(slug);
  if (!definition) throw new Error(`Unknown report ${slug}`);
  const effective = definition.branchScoped ? filters : { ...filters, branchId: "all" };
  const s = scoped(db, effective);
  const builders: Record<ReportSlug, () => Body> = {
    daily: () => dailyReport(db, s),
    patients: () => patientReport(db, s, effective),
    appointments: () => appointmentReport(db, s, effective),
    consultations: () => consultationReport(db, s),
    services: () => serviceReport(db, s, effective),
    payments: () => paymentReport(db, s, effective),
    revenue: () => revenueReport(db, s, effective),
    expenses: () => expenseReport(db, s, effective),
    "profit-loss": () => profitLossReport(db, s),
    members: () => memberReport(db, s, effective),
    referrals: () => referralReport(db, s, effective),
    branches: () => branchReport(db, s),
    outstanding: () => outstandingReport(db, s),
    activity: () => activityReport(db, s, effective),
  };
  return {
    slug,
    title: definition.title,
    description: definition.description,
    generatedAt: new Date().toISOString(),
    appliedFilters: appliedFilters(db, effective, definition.branchScoped),
    ...builders[slug](),
  };
}


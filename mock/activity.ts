import dayjs, { type Dayjs } from "dayjs";

import { formatCurrency } from "@/lib/format";
import { formatId, ID_PREFIX } from "@/lib/ids";
import { MESSAGE_TYPE_LABELS } from "@/lib/messaging/templates";
import type { ActivityLog, Appointment, Consultation, Expense, Invoice, Member, MessageLog, Patient } from "@/types";

import { RECEPTION_BY_BRANCH } from "./members";

interface Input {
  today: Dayjs;
  clinicId: string;
  members: Member[];
  patients: Patient[];
  appointments: Appointment[];
  consultations: Consultation[];
  invoices: Invoice[];
  expenses: Expense[];
  messages: MessageLog[];
}

const WINDOW_DAYS = 30;

/** Builds the audit trail for the last month from the seeded records. */
export function generateActivity(input: Input): ActivityLog[] {
  const { today, clinicId, members } = input;
  const now = dayjs();
  const since = today.subtract(WINDOW_DAYS, "day").format("YYYY-MM-DD");
  const memberName = new Map(members.map((m) => [m.id, m.name]));
  const patientName = new Map(input.patients.map((p) => [p.id, `${p.firstName} ${p.lastName}`]));
  const logs: Omit<ActivityLog, "id">[] = [];

  const add = (at: string, memberId: string, action: ActivityLog["action"], module: ActivityLog["module"], recordId: string, description: string, branchId: string | null) => {
    if (dayjs(at).isAfter(now)) return;
    logs.push({ clinicId, branchId, at, memberId, memberName: memberName.get(memberId) ?? "System", action, module, recordId, description });
  };

  for (const patient of input.patients) {
    if (patient.registeredOn < since) continue;
    add(patient.createdAt, RECEPTION_BY_BRANCH[patient.branchId], "created", "Patients", patient.id, `Registered patient ${patientName.get(patient.id)}`, patient.branchId);
  }
  for (const appointment of input.appointments) {
    if (appointment.date < since) continue;
    const name = patientName.get(appointment.patientId);
    if (appointment.createdAt.slice(0, 10) >= since) {
      add(appointment.createdAt, RECEPTION_BY_BRANCH[appointment.branchId], "created", "Appointments", appointment.id, `Booked ${appointment.type.toLowerCase()} for ${name}`, appointment.branchId);
    }
    const at = dayjs(`${appointment.date}T${appointment.endTime}`).toISOString();
    if (appointment.status === "Completed") add(at, appointment.providerId, "status_changed", "Appointments", appointment.id, `Completed appointment with ${name}`, appointment.branchId);
    if (appointment.status === "Cancelled") add(dayjs(`${appointment.date}T08:25`).toISOString(), RECEPTION_BY_BRANCH[appointment.branchId], "status_changed", "Appointments", appointment.id, `Cancelled appointment for ${name} (${appointment.cancellationReason})`, appointment.branchId);
    if (appointment.status === "No Show") add(at, RECEPTION_BY_BRANCH[appointment.branchId], "status_changed", "Appointments", appointment.id, `Marked ${name} as no-show`, appointment.branchId);
  }
  for (const consultation of input.consultations) {
    if (consultation.date < since) continue;
    add(consultation.createdAt, consultation.providerId, "created", "Consultations", consultation.id, `Recorded consultation for ${patientName.get(consultation.patientId)} — ${consultation.diagnosis}`, consultation.branchId);
  }
  for (const invoice of input.invoices) {
    const reception = RECEPTION_BY_BRANCH[invoice.branchId];
    if (invoice.invoiceDate >= since) add(invoice.createdAt, reception, "created", "Billing", invoice.id, `Created invoice ${invoice.id} for ${patientName.get(invoice.patientId)}`, invoice.branchId);
    for (const payment of invoice.payments) {
      if (payment.date < since) continue;
      const at = dayjs(`${payment.date}T19:35`).toISOString();
      if (payment.kind === "refund") add(at, "MEM-006", "refund", "Billing", invoice.id, `Refunded ${formatCurrency(payment.amount)} on ${invoice.id} (${payment.receiptNumber})`, invoice.branchId);
      else add(at, payment.recordedBy, "payment", "Billing", invoice.id, `Received ${formatCurrency(payment.amount)} via ${payment.method} on ${invoice.id} (${payment.receiptNumber})`, invoice.branchId);
    }
  }
  for (const expense of input.expenses) {
    if (expense.date < since) continue;
    add(expense.createdAt, "MEM-006", "created", "Expenses", expense.id, `Added expense ${expense.description} (${formatCurrency(expense.amount)})`, expense.branchId);
  }
  for (const message of input.messages) {
    if (message.sentBy === "system" || message.sentAt.slice(0, 10) < since) continue;
    add(message.sentAt, message.sentBy, "message_sent", "Messaging", message.relatedId, `Sent ${MESSAGE_TYPE_LABELS[message.type].toLowerCase()} on WhatsApp to ${patientName.get(message.patientId)}`, message.branchId);
  }

  return logs
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((log, index) => ({ ...log, id: formatId(ID_PREFIX.activity, index + 1, 5) }));
}

import dayjs, { type Dayjs } from "dayjs";

import { calculateInvoiceTotals } from "@/lib/billing";
import { formatId, ID_PREFIX } from "@/lib/ids";
import { appointmentContext, invoiceContext, paymentContext } from "@/lib/messaging/context";
import { renderTemplate } from "@/lib/messaging/templates";
import type { Random } from "@/lib/random";
import type { Appointment, Clinic, Invoice, Member, MessageLog, MessageType, Patient } from "@/types";

import { RECEPTION_BY_BRANCH } from "./members";

interface Input {
  random: Random;
  today: Dayjs;
  clinic: Clinic;
  members: Member[];
  patients: Patient[];
  appointments: Appointment[];
  invoices: Invoice[];
}

/** Seeds realistic WhatsApp history for recent appointments and invoices. */
export function generateMessages({ random, today, clinic, members, patients, appointments, invoices }: Input): MessageLog[] {
  const now = dayjs();
  const patientById = new Map(patients.map((p) => [p.id, p]));
  const memberById = new Map(members.map((m) => [m.id, m]));
  const drafts: Omit<MessageLog, "id">[] = [];

  const push = (type: MessageType, patient: Patient, branchId: string, relatedType: MessageLog["relatedType"], relatedId: string, body: string, sentAt: Dayjs, sentBy: string, attachment: MessageLog["attachment"] = null) => {
    if (sentAt.isAfter(now)) return;
    const failed = !patient.consent.communication || random.chance(0.02);
    drafts.push({
      clinicId: clinic.id,
      branchId,
      patientId: patient.id,
      channel: "whatsapp",
      type,
      to: patient.phone,
      body,
      status: failed ? "failed" : sentAt.isBefore(now.subtract(2, "hour")) ? random.pick(["delivered", "read", "read"]) : "delivered",
      error: failed ? (patient.consent.communication ? "Recipient number is not on WhatsApp" : "Patient has not opted in to WhatsApp messages") : "",
      relatedType,
      relatedId,
      attachment,
      sentAt: sentAt.toISOString(),
      sentBy,
      sentByName: sentBy === "system" ? "Automatic reminder" : (memberById.get(sentBy)?.name ?? ""),
      providerMessageId: failed ? "" : `wamid.${random.int(100000000, 999999999)}`,
      createdAt: sentAt.toISOString(),
      updatedAt: sentAt.toISOString(),
    });
  };

  const from = today.subtract(14, "day").format("YYYY-MM-DD");
  const to = today.add(3, "day").format("YYYY-MM-DD");
  for (const appointment of appointments) {
    if (appointment.date < from || appointment.date > to) continue;
    const patient = patientById.get(appointment.patientId);
    if (!patient) continue;
    const context = appointmentContext(appointment, patient, memberById.get(appointment.providerId), clinic);
    const reception = RECEPTION_BY_BRANCH[appointment.branchId];
    if (random.chance(0.7)) {
      push("appointment_confirmation", patient, appointment.branchId, "appointment", appointment.id, renderTemplate(clinic.messaging.templates.appointment_confirmation, context), dayjs(appointment.createdAt).add(3, "minute"), reception);
    }
    if (appointment.status !== "Cancelled") {
      push("appointment_reminder", patient, appointment.branchId, "appointment", appointment.id, renderTemplate(clinic.messaging.templates.appointment_reminder, context), dayjs(`${appointment.date}T${appointment.startTime}`).subtract(clinic.messaging.reminderHoursBefore, "hour"), "system");
    }
    if (appointment.status === "Cancelled") {
      push("appointment_cancellation", patient, appointment.branchId, "appointment", appointment.id, renderTemplate(clinic.messaging.templates.appointment_cancellation, context), dayjs(`${appointment.date}T08:30`), reception);
    }
    if (appointment.status === "Rescheduled") {
      push("appointment_reschedule", patient, appointment.branchId, "appointment", appointment.id, renderTemplate(clinic.messaging.templates.appointment_reschedule, context), dayjs(appointment.createdAt).add(1, "day"), reception);
    }
  }

  for (const invoice of invoices) {
    if (invoice.invoiceDate < from || invoice.cancelled) continue;
    const patient = patientById.get(invoice.patientId);
    if (!patient) continue;
    const reception = RECEPTION_BY_BRANCH[invoice.branchId];
    const totals = calculateInvoiceTotals(invoice);
    if (random.chance(0.45)) {
      push("invoice", patient, invoice.branchId, "invoice", invoice.id, renderTemplate(clinic.messaging.templates.invoice, invoiceContext(invoice, totals, patient, clinic)), dayjs(invoice.createdAt).add(5, "minute"), reception, {
        fileName: `${invoice.id}.pdf`,
        size: random.int(38000, 64000),
        url: `mock://documents/invoices/${invoice.id}.pdf`,
      });
    }
    for (const payment of invoice.payments) {
      if (payment.kind !== "payment" || !random.chance(0.5)) continue;
      push("payment_receipt", patient, invoice.branchId, "payment", payment.id, renderTemplate(clinic.messaging.templates.payment_receipt, paymentContext(payment, invoice.id, patient, clinic)), dayjs(`${payment.date}T19:40`), reception, {
        fileName: `${payment.receiptNumber}.pdf`,
        size: random.int(28000, 42000),
        url: `mock://documents/receipts/${payment.receiptNumber}.pdf`,
      });
    }
  }

  return drafts
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
    .map((draft, index) => ({ ...draft, id: formatId(ID_PREFIX.message, index + 1) }));
}

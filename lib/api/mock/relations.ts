import dayjs from "dayjs";

import { NotFoundError } from "@/lib/api/errors";
import { calculateInvoiceTotals, deriveInvoiceStatus } from "@/lib/billing";
import type {
  Appointment,
  AppointmentWithRelations,
  BranchRef,
  Consultation,
  ConsultationWithRelations,
  Invoice,
  InvoiceWithRelations,
  MemberRef,
  MessageRelatedType,
  MessageSummary,
  Patient,
  PatientListItem,
  PatientRef,
  ServiceRecord,
  ServiceRecordWithRelations,
} from "@/types";

import { getDb } from "./db";

export function patientName(patient: Pick<Patient, "firstName" | "middleName" | "lastName">): string {
  return [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(" ");
}

export function findPatient(id: string): Patient {
  const patient = getDb().patients.find((item) => item.id === id);
  if (!patient) throw new NotFoundError("Patient", id);
  return patient;
}

export function toPatientRef(id: string): PatientRef {
  const patient = getDb().patients.find((item) => item.id === id);
  if (!patient) return { id, name: "Unknown patient", phone: "", gender: "" };
  return { id: patient.id, name: patientName(patient), phone: patient.phone, gender: patient.gender };
}

export function toMemberRef(id: string): MemberRef {
  const member = getDb().members.find((item) => item.id === id);
  return { id, name: member?.name ?? "Unassigned" };
}

export function toBranchRef(id: string): BranchRef {
  const branch = getDb().branches.find((item) => item.id === id);
  return { id, name: branch?.name ?? "—" };
}

export function assertProvider(id: string): void {
  const member = getDb().members.find((item) => item.id === id);
  if (!member) throw new NotFoundError("Provider", id);
}

/** Last completed visit for every patient in one pass. */
export function lastVisitIndex(): Map<string, string> {
  const today = dayjs().format("YYYY-MM-DD");
  const index = new Map<string, string>();
  for (const appointment of getDb().appointments) {
    if (appointment.status !== "Completed" || appointment.date > today) continue;
    const current = index.get(appointment.patientId);
    if (!current || appointment.date > current) index.set(appointment.patientId, appointment.date);
  }
  return index;
}

export function withPatientDetails(patient: Patient, lastVisits = lastVisitIndex()): PatientListItem {
  return {
    ...patient,
    name: patientName(patient),
    age: dayjs().diff(dayjs(patient.dateOfBirth), "year"),
    lastVisit: lastVisits.get(patient.id) ?? null,
    primaryProviderName: toMemberRef(patient.primaryProviderId).name,
    branchName: toBranchRef(patient.branchId).name,
  };
}

/** Latest WhatsApp message per related record. */
export function lastMessageIndex(relatedType: MessageRelatedType): Map<string, MessageSummary> {
  const index = new Map<string, MessageSummary>();
  for (const message of getDb().messages) {
    if (message.relatedType !== relatedType) continue;
    const current = index.get(message.relatedId);
    if (!current || message.sentAt > current.sentAt) {
      index.set(message.relatedId, { id: message.id, type: message.type, status: message.status, sentAt: message.sentAt, sentByName: message.sentByName });
    }
  }
  return index;
}

export function withAppointmentRelations(appointment: Appointment, messages = lastMessageIndex("appointment")): AppointmentWithRelations {
  const service = appointment.serviceId ? getDb().services.find((item) => item.id === appointment.serviceId) : undefined;
  return {
    ...appointment,
    patient: toPatientRef(appointment.patientId),
    provider: toMemberRef(appointment.providerId),
    service: service ? { id: service.id, name: service.name } : null,
    branch: toBranchRef(appointment.branchId),
    lastMessage: messages.get(appointment.id) ?? null,
  };
}

export function withConsultationRelations(consultation: Consultation): ConsultationWithRelations {
  return { ...consultation, patient: toPatientRef(consultation.patientId), provider: toMemberRef(consultation.providerId) };
}

export function invoiceIdByServiceRecord(): Map<string, string> {
  const index = new Map<string, string>();
  for (const invoice of getDb().invoices) {
    if (invoice.cancelled) continue;
    for (const item of invoice.items) if (item.serviceRecordId) index.set(item.serviceRecordId, invoice.id);
  }
  return index;
}

export function withServiceRecordRelations(record: ServiceRecord, invoiceIndex = invoiceIdByServiceRecord()): ServiceRecordWithRelations {
  const service = getDb().services.find((item) => item.id === record.serviceId);
  return {
    ...record,
    patient: toPatientRef(record.patientId),
    provider: toMemberRef(record.providerId),
    service: { id: record.serviceId, name: service?.name ?? record.serviceName, category: service?.category ?? "" },
    invoiceId: invoiceIndex.get(record.id) ?? null,
  };
}

export function withInvoiceRelations(invoice: Invoice, messages = lastMessageIndex("invoice")): InvoiceWithRelations {
  const totals = calculateInvoiceTotals(invoice);
  const payments = [...invoice.payments].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  return {
    ...invoice,
    ...totals,
    payments,
    status: deriveInvoiceStatus(invoice.cancelled, totals),
    patient: toPatientRef(invoice.patientId),
    provider: toMemberRef(invoice.providerId),
    paymentMethod: payments.filter((p) => p.kind === "payment").at(-1)?.method ?? null,
    lastMessage: messages.get(invoice.id) ?? null,
  };
}

import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import type { Appointment, Clinic, Consultation, Invoice, InvoiceTotals, Member, Patient, Payment } from "@/types";

import type { TemplateContext } from "./templates";

/** Builds template variables from domain records. Shared by the mock layer and (later) the backend. */
export function clinicContext(clinic: Pick<Clinic, "name" | "phone" | "address" | "city">): TemplateContext {
  return { clinicName: clinic.name, clinicPhone: clinic.phone, clinicAddress: `${clinic.address}, ${clinic.city}` };
}

export function patientFirstName(patient: Pick<Patient, "firstName">): string {
  return patient.firstName;
}

export function appointmentContext(
  appointment: Pick<Appointment, "date" | "startTime" | "type" | "rescheduledFrom">,
  patient: Pick<Patient, "firstName">,
  provider: Pick<Member, "name"> | undefined,
  clinic: Pick<Clinic, "name" | "phone" | "address" | "city">,
): TemplateContext {
  return {
    ...clinicContext(clinic),
    patientName: patientFirstName(patient),
    providerName: provider?.name ?? "",
    date: formatDate(appointment.date, "DD MMMM YYYY"),
    time: formatTime(appointment.startTime),
    appointmentType: appointment.type,
    previousDate: appointment.rescheduledFrom ? formatDate(appointment.rescheduledFrom.date, "DD MMMM YYYY") : "",
    previousTime: appointment.rescheduledFrom ? formatTime(appointment.rescheduledFrom.startTime) : "",
  };
}

export function invoiceContext(
  invoice: Pick<Invoice, "id" | "dueDate">,
  totals: Pick<InvoiceTotals, "total" | "balance">,
  patient: Pick<Patient, "firstName">,
  clinic: Pick<Clinic, "name" | "phone" | "address" | "city">,
): TemplateContext {
  return {
    ...clinicContext(clinic),
    patientName: patientFirstName(patient),
    invoiceNumber: invoice.id,
    amount: formatCurrency(totals.total),
    balance: formatCurrency(totals.balance),
    dueDate: formatDate(invoice.dueDate, "DD MMMM YYYY"),
  };
}

export function paymentContext(
  payment: Pick<Payment, "amount" | "method" | "receiptNumber" | "date">,
  invoiceId: string,
  patient: Pick<Patient, "firstName">,
  clinic: Pick<Clinic, "name" | "phone" | "address" | "city">,
): TemplateContext {
  return {
    ...clinicContext(clinic),
    patientName: patientFirstName(patient),
    invoiceNumber: invoiceId,
    amount: formatCurrency(payment.amount),
    paymentMethod: payment.method,
    receiptNumber: payment.receiptNumber,
    date: formatDate(payment.date, "DD MMMM YYYY"),
  };
}

export function consultationContext(
  consultation: Pick<Consultation, "date" | "diagnosis" | "followUpDate">,
  patient: Pick<Patient, "firstName">,
  provider: Pick<Member, "name"> | undefined,
  clinic: Pick<Clinic, "name" | "phone" | "address" | "city">,
): TemplateContext {
  return {
    ...clinicContext(clinic),
    patientName: patientFirstName(patient),
    providerName: provider?.name ?? "",
    date: formatDate(consultation.date, "DD MMMM YYYY"),
    diagnosis: consultation.diagnosis,
    followUpDate: consultation.followUpDate ? formatDate(consultation.followUpDate, "DD MMMM YYYY") : "as advised",
  };
}

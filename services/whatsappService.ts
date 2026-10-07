import dayjs from "dayjs";

import { http } from "@/lib/api/client";
import { isMockApi } from "@/lib/api/config";
import { ApiError, NotFoundError } from "@/lib/api/errors";
import { actorName, logActivity } from "@/lib/api/mock/audit";
import { commit, getDb, nowISO } from "@/lib/api/mock/db";
import { patientName } from "@/lib/api/mock/relations";
import { run } from "@/lib/api/mock/run";
import { getActorId } from "@/lib/api/session";
import { calculateInvoiceTotals } from "@/lib/billing";
import { formatDate } from "@/lib/format";
import { ID_PREFIX, nextId } from "@/lib/ids";
import { appointmentContext, clinicContext, consultationContext, invoiceContext, paymentContext } from "@/lib/messaging/context";
import { MESSAGE_TYPE_LABELS, renderTemplate, type TemplateContext } from "@/lib/messaging/templates";
import type { MessageLog, MessageRelatedType, MessageType, Patient, SendMessageInput } from "@/types";

export interface MessagePreview {
  type: MessageType;
  patientId: string;
  patientName: string;
  to: string;
  body: string;
  canSend: boolean;
  blockedReason: string;
}

export interface MessageFilters {
  patientId?: string;
  relatedType?: MessageRelatedType;
  relatedId?: string;
}

/**
 * WhatsApp messaging. The mock implementation renders the clinic's templates and
 * records delivery like a provider would; the live implementation posts to the
 * backend, which talks to the WhatsApp Business (Cloud) API.
 */
export interface WhatsAppService {
  preview(type: MessageType, relatedType: MessageRelatedType, relatedId: string): Promise<MessagePreview>;
  send(input: SendMessageInput): Promise<MessageLog>;
  list(filters: MessageFilters): Promise<MessageLog[]>;
}

interface Resolved {
  patient: Patient;
  branchId: string;
  context: TemplateContext;
}

function resolve(relatedType: MessageRelatedType, relatedId: string): Resolved {
  const db = getDb();
  const patientById = (id: string) => {
    const patient = db.patients.find((item) => item.id === id);
    if (!patient) throw new NotFoundError("Patient", id);
    return patient;
  };
  const provider = (id: string) => db.members.find((member) => member.id === id);

  switch (relatedType) {
    case "appointment": {
      const appointment = db.appointments.find((item) => item.id === relatedId);
      if (!appointment) throw new NotFoundError("Appointment", relatedId);
      const patient = patientById(appointment.patientId);
      return { patient, branchId: appointment.branchId, context: appointmentContext(appointment, patient, provider(appointment.providerId), db.clinic) };
    }
    case "invoice": {
      const invoice = db.invoices.find((item) => item.id === relatedId);
      if (!invoice) throw new NotFoundError("Invoice", relatedId);
      const patient = patientById(invoice.patientId);
      return { patient, branchId: invoice.branchId, context: invoiceContext(invoice, calculateInvoiceTotals(invoice), patient, db.clinic) };
    }
    case "payment": {
      const invoice = db.invoices.find((item) => item.payments.some((payment) => payment.id === relatedId));
      const payment = invoice?.payments.find((item) => item.id === relatedId);
      if (!invoice || !payment) throw new NotFoundError("Payment", relatedId);
      const patient = patientById(invoice.patientId);
      return { patient, branchId: invoice.branchId, context: paymentContext(payment, invoice.id, patient, db.clinic) };
    }
    case "consultation": {
      const consultation = db.consultations.find((item) => item.id === relatedId);
      if (!consultation) throw new NotFoundError("Consultation", relatedId);
      const patient = patientById(consultation.patientId);
      return { patient, branchId: consultation.branchId, context: consultationContext(consultation, patient, provider(consultation.providerId), db.clinic) };
    }
    case "serviceRecord": {
      const record = db.serviceRecords.find((item) => item.id === relatedId);
      if (!record) throw new NotFoundError("Service record", relatedId);
      const patient = patientById(record.patientId);
      return {
        patient,
        branchId: record.branchId,
        context: { ...clinicContext(db.clinic), patientName: patient.firstName, providerName: provider(record.providerId)?.name ?? "", date: formatDate(record.date, "DD MMMM YYYY") },
      };
    }
    case "patient": {
      const patient = patientById(relatedId);
      return { patient, branchId: patient.branchId, context: { ...clinicContext(db.clinic), patientName: patient.firstName } };
    }
  }
}

function blockedReason(patient: Patient): string {
  const db = getDb();
  if (!db.clinic.messaging.whatsappEnabled) return "WhatsApp messaging is turned off in Clinic → Messaging.";
  if (!patient.consent.communication) return "The patient has not opted in to WhatsApp messages (update consent in the patient profile).";
  if (patient.phone.replace(/\D/g, "").length < 10) return "The patient does not have a valid mobile number.";
  return "";
}

const mockWhatsAppService: WhatsAppService = {
  preview: (type, relatedType, relatedId) =>
    run(() => {
      const { patient, context } = resolve(relatedType, relatedId);
      const reason = blockedReason(patient);
      return {
        type,
        patientId: patient.id,
        patientName: patientName(patient),
        to: patient.phone,
        body: renderTemplate(getDb().clinic.messaging.templates[type], context),
        canSend: !reason,
        blockedReason: reason,
      };
    }, 80),
  send: (input) =>
    run(() => {
      const db = getDb();
      const { patient, branchId, context } = resolve(input.relatedType, input.relatedId);
      const reason = blockedReason(patient);
      const now = nowISO();
      const message: MessageLog = {
        id: nextId(ID_PREFIX.message, db.messages.map((m) => m.id)),
        clinicId: db.clinic.id,
        branchId,
        patientId: patient.id,
        channel: "whatsapp",
        type: input.type,
        to: patient.phone,
        body: input.body?.trim() || renderTemplate(db.clinic.messaging.templates[input.type], context),
        status: reason ? "failed" : "sent",
        error: reason,
        relatedType: input.relatedType,
        relatedId: input.relatedId,
        attachment: input.attachment ?? null,
        sentAt: now,
        sentBy: getActorId(),
        sentByName: actorName(),
        providerMessageId: reason ? "" : `wamid.mock.${dayjs().valueOf()}`,
        createdAt: now,
        updatedAt: now,
      };
      db.messages.push(message);
      commit();
      logActivity("message_sent", "Messaging", input.relatedId, `${reason ? "Failed to send" : "Sent"} ${MESSAGE_TYPE_LABELS[input.type].toLowerCase()} on WhatsApp to ${patientName(patient)}`, branchId);
      if (reason) throw new ApiError(reason, 422, { messageId: message.id });
      // Simulate the provider's delivery receipt.
      setTimeout(() => {
        message.status = "delivered";
        message.updatedAt = nowISO();
        commit();
      }, 2500);
      return message;
    }, 900),
  list: (filters) =>
    run(() =>
      getDb()
        .messages.filter(
          (message) =>
            (!filters.patientId || message.patientId === filters.patientId) &&
            (!filters.relatedType || message.relatedType === filters.relatedType) &&
            (!filters.relatedId || message.relatedId === filters.relatedId),
        )
        .sort((a, b) => b.sentAt.localeCompare(a.sentAt)),
    ),
};

const httpWhatsAppService: WhatsAppService = {
  preview: (type, relatedType, relatedId) => http.get<MessagePreview>("/messages/preview", { type, relatedType, relatedId }),
  send: (input) => http.post<MessageLog>("/messages/whatsapp", input),
  list: (filters) => http.get<MessageLog[]>("/messages", filters),
};

export const whatsappService = isMockApi ? mockWhatsAppService : httpWhatsAppService;

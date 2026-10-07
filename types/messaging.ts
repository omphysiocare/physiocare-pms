import type { BaseEntity, ISODateTime, TenantScoped } from "./common";

export const MESSAGE_TYPES = [
  "patient_welcome",
  "appointment_confirmation",
  "appointment_reminder",
  "appointment_cancellation",
  "appointment_reschedule",
  "follow_up_reminder",
  "payment_reminder",
  "invoice",
  "payment_receipt",
  "prescription",
  "consultation_summary",
  "treatment_update",
  "review_request",
] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

export type MessageStatus = "queued" | "sent" | "delivered" | "read" | "failed";
export type MessageRelatedType = "appointment" | "invoice" | "payment" | "consultation" | "patient" | "serviceRecord";

export interface MessageAttachment {
  fileName: string;
  size: number;
  url: string;
}

export interface MessageLog extends BaseEntity, TenantScoped {
  patientId: string;
  channel: "whatsapp";
  type: MessageType;
  to: string;
  body: string;
  status: MessageStatus;
  error: string;
  relatedType: MessageRelatedType;
  relatedId: string;
  attachment: MessageAttachment | null;
  sentAt: ISODateTime;
  sentBy: string;
  sentByName: string;
  providerMessageId: string;
}

/** Last message summary shown next to "Send WhatsApp" buttons. */
export interface MessageSummary {
  id: string;
  type: MessageType;
  status: MessageStatus;
  sentAt: ISODateTime;
  sentByName: string;
}

export interface SendMessageInput {
  type: MessageType;
  patientId: string;
  relatedType: MessageRelatedType;
  relatedId: string;
  /** Optional edited body; defaults to the rendered template. */
  body?: string;
  attachment?: MessageAttachment | null;
}

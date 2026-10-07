import type { MessageType } from "@/types";

export const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  patient_welcome: "Welcome message",
  appointment_confirmation: "Appointment confirmation",
  appointment_reminder: "Appointment reminder",
  appointment_cancellation: "Appointment cancellation",
  appointment_reschedule: "Appointment rescheduled",
  follow_up_reminder: "Follow-up reminder",
  payment_reminder: "Payment reminder",
  invoice: "Invoice",
  payment_receipt: "Payment receipt",
  prescription: "Prescription",
  consultation_summary: "Consultation summary",
  treatment_update: "Treatment update",
  review_request: "Review request",
};

/** Placeholders available to templates. */
export const TEMPLATE_VARIABLES = [
  "patientName",
  "clinicName",
  "clinicPhone",
  "clinicAddress",
  "providerName",
  "date",
  "time",
  "appointmentType",
  "previousDate",
  "previousTime",
  "invoiceNumber",
  "amount",
  "balance",
  "dueDate",
  "receiptNumber",
  "paymentMethod",
  "followUpDate",
  "diagnosis",
] as const;
export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];
export type TemplateContext = Partial<Record<TemplateVariable, string>>;

export const DEFAULT_TEMPLATES: Record<MessageType, string> = {
  patient_welcome:
    "Dear {{patientName}},\n\nWelcome to {{clinicName}}! Your patient profile has been created. For appointments or queries, call us on {{clinicPhone}}.\n\nThank you.",
  appointment_confirmation:
    "Dear {{patientName}},\n\nYour appointment at {{clinicName}} has been confirmed.\n\nDate: {{date}}\nTime: {{time}}\nWith: {{providerName}}\nType: {{appointmentType}}\n\nAddress: {{clinicAddress}}\nFor changes call {{clinicPhone}}.\n\nThank you.",
  appointment_reminder:
    "Dear {{patientName}},\n\nThis is a reminder of your appointment at {{clinicName}}.\n\nDate: {{date}}\nTime: {{time}}\nWith: {{providerName}}\n\nPlease arrive 10 minutes early. Call {{clinicPhone}} to reschedule.",
  appointment_cancellation:
    "Dear {{patientName}},\n\nYour appointment at {{clinicName}} on {{date}} at {{time}} with {{providerName}} has been cancelled.\n\nTo book a new appointment, call {{clinicPhone}}.",
  appointment_reschedule:
    "Dear {{patientName}},\n\nYour appointment at {{clinicName}} has been rescheduled.\n\nNew date: {{date}}\nNew time: {{time}}\nWith: {{providerName}}\n(Previously {{previousDate}} at {{previousTime}})\n\nFor queries call {{clinicPhone}}.",
  follow_up_reminder:
    "Dear {{patientName}},\n\nYour follow-up visit at {{clinicName}} is due on {{followUpDate}}. Please call {{clinicPhone}} or reply to book a convenient time.\n\nThank you.",
  payment_reminder:
    "Dear {{patientName}},\n\nA balance of {{balance}} is pending on invoice {{invoiceNumber}} from {{clinicName}} (due {{dueDate}}).\n\nYou can pay at the clinic or via UPI. Thank you.",
  invoice:
    "Dear {{patientName}},\n\nPlease find attached invoice {{invoiceNumber}} from {{clinicName}}.\n\nTotal: {{amount}}\nBalance due: {{balance}}\nDue date: {{dueDate}}\n\nThank you.",
  payment_receipt:
    "Dear {{patientName}},\n\nWe have received your payment of {{amount}} via {{paymentMethod}} towards invoice {{invoiceNumber}}.\nReceipt no: {{receiptNumber}}\n\nThank you for choosing {{clinicName}}.",
  prescription:
    "Dear {{patientName}},\n\nPlease find attached your prescription from {{providerName}} at {{clinicName}}.\n\nFollow-up: {{followUpDate}}\n\nGet well soon!",
  consultation_summary:
    "Dear {{patientName}},\n\nSummary of your visit with {{providerName}} on {{date}}:\nDiagnosis: {{diagnosis}}\nFollow-up: {{followUpDate}}\n\n{{clinicName}} · {{clinicPhone}}",
  treatment_update:
    "Dear {{patientName}},\n\nAn update on your treatment at {{clinicName}}: your session on {{date}} with {{providerName}} is complete. Please continue your home programme.\n\nThank you.",
  review_request:
    "Dear {{patientName}},\n\nThank you for visiting {{clinicName}}. We'd love your feedback — please take a minute to leave us a review.\n\nThank you!",
};

/** Replaces {{variable}} placeholders; unknown/missing values render as "—". */
export function renderTemplate(template: string, context: TemplateContext): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => context[key as TemplateVariable] || "—");
}

/** Click-to-chat link that works today without any API (opens WhatsApp Web/app). */
export function whatsappDeepLink(phone: string, body: string): string {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(body)}`;
}

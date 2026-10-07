import type { ISODateTime } from "./common";

export const FAQ_CATEGORIES = [
  "Getting started",
  "Patients",
  "Appointments",
  "Consultations",
  "Billing",
  "Reports",
  "Members",
  "Permissions",
  "Subscription",
  "Clinic settings",
] as const;
export type FaqCategory = (typeof FAQ_CATEGORIES)[number];

export interface Faq {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
}

export const TICKET_STATUSES = ["Open", "In Progress", "Resolved", "Closed"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_CATEGORIES = ["Technical issue", "Billing & subscription", "Feature request", "Data & import", "Account access", "Other"] as const;
export type TicketCategory = (typeof TICKET_CATEGORIES)[number];

export interface TicketMessage {
  id: string;
  author: { type: "member" | "support"; name: string };
  body: string;
  at: ISODateTime;
}

export interface TicketEvent {
  at: ISODateTime;
  text: string;
}

export interface SupportTicket {
  id: string;
  clinicId: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdBy: string;
  createdByName: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  messages: TicketMessage[];
  history: TicketEvent[];
}

import type { AppointmentStatus, ExpenseStatus, InvoiceStatus, MemberStatus, PatientStatus, ServiceRecordStatus, TicketStatus } from "@/types";

export type StatusTone = "success" | "warning" | "error" | "info" | "primary" | "neutral" | "secondary";

export type AnyStatus = PatientStatus | AppointmentStatus | ServiceRecordStatus | InvoiceStatus | ExpenseStatus | MemberStatus | TicketStatus;

/** Single source of truth for how every status in the product is colored. */
const STATUS_TONES: Record<AnyStatus, StatusTone> = {
  Active: "success",
  Inactive: "neutral",
  Discharged: "info",
  Invited: "secondary",
  Scheduled: "info",
  Confirmed: "primary",
  "Checked In": "secondary",
  "In Consultation": "warning",
  "In Progress": "warning",
  Completed: "success",
  Cancelled: "error",
  "No Show": "error",
  Rescheduled: "secondary",
  Paid: "success",
  "Partially Paid": "warning",
  Pending: "warning",
  Refunded: "neutral",
  Open: "info",
  Resolved: "success",
  Closed: "neutral",
};

export function getStatusTone(status: string): StatusTone {
  return STATUS_TONES[status as AnyStatus] ?? "neutral";
}

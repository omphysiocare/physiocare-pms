import type { BaseEntity, BranchRef, ISODate, ISODateTime, MemberRef, PatientRef, TenantScoped, TimeString } from "./common";
import type { MessageSummary } from "./messaging";

export const APPOINTMENT_STATUSES = [
  "Scheduled",
  "Confirmed",
  "Checked In",
  "In Consultation",
  "Completed",
  "Cancelled",
  "No Show",
  "Rescheduled",
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/** Statuses that still occupy the provider's calendar. */
export const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = ["Scheduled", "Confirmed", "Rescheduled", "Checked In", "In Consultation"];

export interface Appointment extends BaseEntity, TenantScoped {
  patientId: string;
  providerId: string;
  serviceId: string | null;
  date: ISODate;
  startTime: TimeString;
  endTime: TimeString;
  /** Configurable per specialty, e.g. "New Consultation", "Follow-up". */
  type: string;
  status: AppointmentStatus;
  reason: string;
  notes: string;
  location: string;
  checkedInAt: ISODateTime | null;
  cancellationReason: string;
  rescheduledFrom: { date: ISODate; startTime: TimeString } | null;
}

export interface AppointmentWithRelations extends Appointment {
  patient: PatientRef;
  provider: MemberRef;
  service: { id: string; name: string } | null;
  branch: BranchRef;
  lastMessage: MessageSummary | null;
}

import type { ISODateTime } from "./common";

export const ACTIVITY_MODULES = [
  "Patients",
  "Appointments",
  "Consultations",
  "Services",
  "Billing",
  "Expenses",
  "Messaging",
  "Members",
  "Permissions",
  "Clinic",
  "Subscription",
  "Support",
  "Reports",
] as const;
export type ActivityModule = (typeof ACTIVITY_MODULES)[number];

export type ActivityAction =
  | "created"
  | "updated"
  | "deleted"
  | "status_changed"
  | "payment"
  | "refund"
  | "message_sent"
  | "exported"
  | "invited"
  | "uploaded";

export interface ActivityLog {
  id: string;
  clinicId: string;
  branchId: string | null;
  at: ISODateTime;
  memberId: string;
  memberName: string;
  action: ActivityAction;
  module: ActivityModule;
  recordId: string;
  description: string;
}

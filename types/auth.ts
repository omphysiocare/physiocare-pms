export const PERMISSIONS = [
  "dashboard.view",
  "patients.view",
  "patients.create",
  "patients.edit",
  "patients.delete",
  "appointments.view",
  "appointments.create",
  "appointments.edit",
  "appointments.cancel",
  "consultations.view",
  "consultations.create",
  "consultations.edit",
  "consultations.delete",
  "services.view",
  "services.create",
  "services.edit",
  "services.delete",
  "billing.view",
  "billing.create",
  "billing.edit",
  "billing.delete",
  "billing.refund",
  "expenses.view",
  "expenses.create",
  "expenses.edit",
  "expenses.delete",
  "reports.view",
  "reports.export",
  "messaging.send",
  "members.view",
  "members.create",
  "members.edit",
  "members.remove",
  "permissions.manage",
  "clinic.view",
  "clinic.edit",
  "subscription.view",
  "subscription.manage",
  "support.view",
  "audit.view",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const MEMBER_ROLES = [
  "Owner",
  "Admin",
  "Doctor",
  "Dentist",
  "Physiotherapist",
  "Nurse",
  "Receptionist",
  "Accountant",
  "Assistant",
  "Manager",
  "Other",
] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export interface RolePermissions {
  role: MemberRole;
  permissions: Permission[];
  /** Locked roles (Owner) always have every permission. */
  locked: boolean;
  description: string;
}

export interface Session {
  memberId: string;
  clinicId: string;
  role: MemberRole;
  permissions: Permission[];
}

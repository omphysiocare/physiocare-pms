import { PERMISSIONS, type MemberRole, type Permission, type RolePermissions } from "@/types";

export interface PermissionGroup {
  module: string;
  description: string;
  permissions: { key: Permission; label: string }[];
}

const action = (key: Permission): { key: Permission; label: string } => {
  const verb = key.split(".")[1];
  return { key, label: verb.charAt(0).toUpperCase() + verb.slice(1) };
};

/** Permission catalog grouped for the permissions matrix UI. */
export const PERMISSION_GROUPS: PermissionGroup[] = [
  { module: "Dashboard", description: "Clinic overview", permissions: [action("dashboard.view")] },
  { module: "Patients", description: "Patient records, documents and notes", permissions: ["patients.view", "patients.create", "patients.edit", "patients.delete"].map((k) => action(k as Permission)) },
  { module: "Appointments", description: "Scheduling and calendar", permissions: ["appointments.view", "appointments.create", "appointments.edit", "appointments.cancel"].map((k) => action(k as Permission)) },
  { module: "Consultations", description: "Clinical notes and prescriptions", permissions: ["consultations.view", "consultations.create", "consultations.edit", "consultations.delete"].map((k) => action(k as Permission)) },
  { module: "Clinical services", description: "Treatments, procedures and sessions", permissions: ["services.view", "services.create", "services.edit", "services.delete"].map((k) => action(k as Permission)) },
  { module: "Billing", description: "Invoices, payments and refunds", permissions: ["billing.view", "billing.create", "billing.edit", "billing.delete", "billing.refund"].map((k) => action(k as Permission)) },
  { module: "Expenses", description: "Clinic expenses", permissions: ["expenses.view", "expenses.create", "expenses.edit", "expenses.delete"].map((k) => action(k as Permission)) },
  { module: "Reports", description: "Analytics and exports", permissions: [action("reports.view"), action("reports.export"), action("audit.view")] },
  { module: "Messaging", description: "WhatsApp patient communication", permissions: [action("messaging.send")] },
  { module: "Members", description: "Clinic team", permissions: ["members.view", "members.create", "members.edit", "members.remove"].map((k) => action(k as Permission)) },
  { module: "Administration", description: "Clinic settings, roles and subscription", permissions: [action("permissions.manage"), action("clinic.view"), action("clinic.edit"), action("subscription.view"), action("subscription.manage"), action("support.view")] },
];

const all = [...PERMISSIONS];
const clinical: Permission[] = [
  "dashboard.view",
  "patients.view",
  "patients.create",
  "patients.edit",
  "appointments.view",
  "appointments.create",
  "appointments.edit",
  "appointments.cancel",
  "consultations.view",
  "consultations.create",
  "consultations.edit",
  "services.view",
  "services.create",
  "services.edit",
  "billing.view",
  "messaging.send",
  "reports.view",
  "members.view",
  "clinic.view",
  "support.view",
];

export const DEFAULT_ROLE_PERMISSIONS: Record<MemberRole, { permissions: Permission[]; description: string }> = {
  Owner: { permissions: all, description: "Full access to everything, including subscription." },
  Admin: { permissions: all.filter((p) => p !== "subscription.manage"), description: "Manages the clinic, team and settings." },
  Manager: {
    permissions: [...clinical, "billing.create", "billing.edit", "expenses.view", "expenses.create", "expenses.edit", "reports.export", "audit.view", "members.create", "members.edit"],
    description: "Runs daily operations across branches.",
  },
  Doctor: { permissions: [...clinical, "billing.create"], description: "Sees patients and records clinical notes." },
  Dentist: { permissions: [...clinical, "billing.create"], description: "Sees patients and performs procedures." },
  Physiotherapist: { permissions: [...clinical, "billing.create"], description: "Assesses and treats patients." },
  Nurse: {
    permissions: ["dashboard.view", "patients.view", "patients.edit", "appointments.view", "appointments.edit", "consultations.view", "services.view", "services.edit", "support.view"],
    description: "Assists with vitals, check-in and procedures.",
  },
  Receptionist: {
    permissions: [
      "dashboard.view",
      "patients.view",
      "patients.create",
      "patients.edit",
      "appointments.view",
      "appointments.create",
      "appointments.edit",
      "appointments.cancel",
      "billing.view",
      "billing.create",
      "messaging.send",
      "services.view",
      "support.view",
    ],
    description: "Front desk: registration, scheduling and billing.",
  },
  Accountant: {
    permissions: ["dashboard.view", "patients.view", "billing.view", "billing.create", "billing.edit", "billing.refund", "expenses.view", "expenses.create", "expenses.edit", "expenses.delete", "reports.view", "reports.export", "subscription.view", "support.view"],
    description: "Finance: billing, expenses and reports.",
  },
  Assistant: { permissions: ["dashboard.view", "patients.view", "appointments.view", "services.view", "support.view"], description: "Read-only clinical support." },
  Other: { permissions: ["dashboard.view", "support.view"], description: "Minimal access." },
};

export function defaultRolePermissions(): RolePermissions[] {
  return (Object.keys(DEFAULT_ROLE_PERMISSIONS) as MemberRole[]).map((role) => ({
    role,
    permissions: [...DEFAULT_ROLE_PERMISSIONS[role].permissions],
    locked: role === "Owner",
    description: DEFAULT_ROLE_PERMISSIONS[role].description,
  }));
}

/** Roles that are bookable providers by default. */
export const PROVIDER_ROLES: MemberRole[] = ["Doctor", "Dentist", "Physiotherapist"];

/** Single permission check used everywhere in the UI. Backend enforcement is authoritative. */
export function hasPermission(granted: readonly Permission[], permission: Permission | Permission[]): boolean {
  const required = Array.isArray(permission) ? permission : [permission];
  return required.every((item) => granted.includes(item));
}

export function hasAnyPermission(granted: readonly Permission[], permissions: Permission[]): boolean {
  return permissions.some((item) => granted.includes(item));
}

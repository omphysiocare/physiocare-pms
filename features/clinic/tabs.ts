export const CLINIC_TABS = ["profile", "specialty", "branches", "hours", "appointments", "billing", "messaging", "services"] as const;
export type ClinicTab = (typeof CLINIC_TABS)[number];

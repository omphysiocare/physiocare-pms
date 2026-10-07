import type { BaseEntity, ISODate } from "./common";
import type { MessageType } from "./messaging";
import type { SpecialtyId } from "./specialty";

export const CLINIC_TYPES = ["Solo practice", "Single-specialty clinic", "Multi-specialty clinic", "Hospital / OPD centre"] as const;
export type ClinicType = (typeof CLINIC_TYPES)[number];

export const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];

export interface WorkingDay {
  day: WeekDay;
  open: boolean;
  start: string;
  end: string;
}

export interface Holiday {
  id: string;
  date: ISODate;
  name: string;
}

export interface AppointmentSettings {
  slotDurationMinutes: number;
  bufferMinutes: number;
  allowOverlapping: boolean;
  defaultProviderId: string;
}

export interface BillingSettings {
  invoicePrefix: string;
  receiptPrefix: string;
  defaultTaxRate: number;
  paymentTermsDays: number;
  invoiceFooter: string;
  termsAndConditions: string;
}

export interface BrandingSettings {
  accentColor: string;
  showLogo: boolean;
  signatureLabel: string;
}

export interface MessagingSettings {
  whatsappEnabled: boolean;
  whatsappNumber: string;
  autoReminders: boolean;
  reminderHoursBefore: number;
  templates: Record<MessageType, string>;
}

export interface Clinic extends BaseEntity {
  name: string;
  logo: string | null;
  clinicType: ClinicType;
  primarySpecialty: SpecialtyId;
  specialties: SpecialtyId[];
  tagline: string;
  registrationNumber: string;
  gstin: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  currency: string;
  timezone: string;
  workingHours: WorkingDay[];
  holidays: Holiday[];
  appointmentSettings: AppointmentSettings;
  billingSettings: BillingSettings;
  branding: BrandingSettings;
  messaging: MessagingSettings;
}

export type ClinicProfileInput = Pick<
  Clinic,
  | "name"
  | "logo"
  | "clinicType"
  | "primarySpecialty"
  | "specialties"
  | "tagline"
  | "registrationNumber"
  | "gstin"
  | "phone"
  | "email"
  | "website"
  | "address"
  | "city"
  | "state"
  | "country"
  | "pincode"
  | "currency"
  | "timezone"
>;

export interface Branch extends BaseEntity {
  clinicId: string;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  isMain: boolean;
  active: boolean;
  openedOn: ISODate;
}

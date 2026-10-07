import { DEFAULT_TEMPLATES } from "@/lib/messaging/templates";
import type { Clinic } from "@/types";

export const CLINIC_ID = "CLN-001";
const CREATED = "2024-04-01T09:00:00.000Z";

export const CLINIC_SEED: Clinic = {
  id: CLINIC_ID,
  name: "Om Health Care",
  logo: null,
  clinicType: "Single-specialty clinic",
  primarySpecialty: "physiotherapy",
  specialties: ["physiotherapy"],
  tagline: "Move better. Live better.",
  registrationNumber: "GJ/AHD/CLN/2019/0457",
  gstin: "24ABCPM1234F1Z5",
  phone: "+91 79 4000 1234",
  email: "care@omhealthcare.in",
  website: "www.omhealthcare.in",
  address: "2nd Floor, Shivalik Plaza, Near IIM Road, Ambawadi",
  city: "Ahmedabad",
  state: "Gujarat",
  country: "India",
  pincode: "380015",
  currency: "INR",
  timezone: "Asia/Kolkata",
  workingHours: [
    { day: "Mon", open: true, start: "09:00", end: "20:00" },
    { day: "Tue", open: true, start: "09:00", end: "20:00" },
    { day: "Wed", open: true, start: "09:00", end: "20:00" },
    { day: "Thu", open: true, start: "09:00", end: "20:00" },
    { day: "Fri", open: true, start: "09:00", end: "20:00" },
    { day: "Sat", open: true, start: "09:00", end: "14:00" },
    { day: "Sun", open: false, start: "09:00", end: "13:00" },
  ],
  holidays: [
    { id: "HOL-1", date: "2026-10-20", name: "Diwali" },
    { id: "HOL-2", date: "2026-10-21", name: "Gujarati New Year" },
    { id: "HOL-3", date: "2026-12-25", name: "Christmas" },
  ],
  appointmentSettings: { slotDurationMinutes: 45, bufferMinutes: 0, allowOverlapping: false, defaultProviderId: "MEM-001" },
  billingSettings: {
    invoicePrefix: "INV",
    receiptPrefix: "RCPT",
    defaultTaxRate: 0,
    paymentTermsDays: 7,
    invoiceFooter: "Thank you for choosing Om Health Care. Get well soon!",
    termsAndConditions: "Packages are non-transferable. Missed sessions without 4 hours' notice are chargeable.",
  },
  branding: { accentColor: "#2563EB", showLogo: true, signatureLabel: "Authorised Signatory" },
  messaging: {
    whatsappEnabled: true,
    whatsappNumber: "+91 98250 40000",
    autoReminders: true,
    reminderHoursBefore: 24,
    templates: { ...DEFAULT_TEMPLATES },
  },
  createdAt: CREATED,
  updatedAt: CREATED,
};

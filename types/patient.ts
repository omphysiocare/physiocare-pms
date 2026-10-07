import type { BaseEntity, ISODate, ISODateTime, TenantScoped } from "./common";

export const PATIENT_STATUSES = ["Active", "Inactive", "Discharged"] as const;
export type PatientStatus = (typeof PATIENT_STATUSES)[number];

export const GENDERS = ["Male", "Female", "Other"] as const;
export type Gender = (typeof GENDERS)[number];

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const REFERRAL_SOURCES = [
  "Google",
  "Instagram",
  "Facebook",
  "Doctor referral",
  "Patient referral",
  "Walk-in",
  "Website",
  "Other",
] as const;
export type ReferralSource = (typeof REFERRAL_SOURCES)[number];

export const ID_TYPES = ["Aadhaar", "PAN", "Passport", "Driving Licence", "Voter ID", "Other"] as const;
export type IdType = (typeof ID_TYPES)[number];

export interface Address {
  line: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface MedicalProfile {
  /** Main presenting condition or diagnosis. */
  primaryCondition: string;
  currentCondition: string;
  existingConditions: string;
  medicalHistory: string;
  surgicalHistory: string;
  familyHistory: string;
  allergies: string;
  currentMedications: string;
  lifestyle: string;
}

export interface Insurance {
  provider: string;
  policyNumber: string;
  validTill: ISODate | "";
}

export interface Identification {
  type: IdType | "";
  number: string;
}

export interface Consent {
  treatment: boolean;
  communication: boolean;
  date: ISODate | "";
}

export interface Patient extends BaseEntity, TenantScoped {
  firstName: string;
  middleName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: ISODate;
  bloodGroup: BloodGroup;
  photo: string | null;
  occupation: string;
  phone: string;
  alternatePhone: string;
  email: string;
  address: Address;
  emergencyContact: EmergencyContact;
  medical: MedicalProfile;
  referral: { source: ReferralSource; detail: string };
  insurance: Insurance;
  identification: Identification;
  consent: Consent;
  primaryProviderId: string;
  status: PatientStatus;
  registeredOn: ISODate;
  notes: string;
}

export interface PatientListItem extends Patient {
  name: string;
  age: number;
  lastVisit: ISODate | null;
  primaryProviderName: string;
  branchName: string;
}

export const DOCUMENT_CATEGORIES = ["Report", "Imaging", "Prescription", "Consent form", "ID proof", "Insurance", "Other"] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export interface PatientDocument {
  id: string;
  patientId: string;
  name: string;
  category: DocumentCategory;
  fileName: string;
  mimeType: string;
  size: number;
  /** Small files are kept inline in mock mode; the backend stores files in object storage. */
  dataUrl: string | null;
  uploadedAt: ISODateTime;
  uploadedBy: string;
}

export interface PatientNote {
  id: string;
  patientId: string;
  text: string;
  createdAt: ISODateTime;
  authorId: string;
  authorName: string;
}

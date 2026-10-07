import type { BaseEntity, CustomFieldValues, ISODate, MemberRef, PatientRef, TenantScoped } from "./common";

export interface Vitals {
  bpSystolic: number | null;
  bpDiastolic: number | null;
  pulse: number | null;
  temperature: number | null;
  spo2: number | null;
  respiratoryRate: number | null;
  weight: number | null;
  height: number | null;
}

export interface PrescriptionItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export const VISIT_TYPES = ["New", "Follow-up"] as const;
export type VisitType = (typeof VISIT_TYPES)[number];

export interface Consultation extends BaseEntity, TenantScoped {
  patientId: string;
  providerId: string;
  appointmentId: string | null;
  date: ISODate;
  visitType: VisitType;
  chiefComplaint: string;
  history: string;
  medicalHistory: string;
  surgicalHistory: string;
  familyHistory: string;
  allergies: string;
  currentMedications: string;
  vitals: Vitals;
  examination: string;
  findings: string;
  /** Specialty template used for the custom clinical fields. */
  templateId: string;
  customFields: CustomFieldValues;
  assessment: string;
  diagnosis: string;
  treatmentPlan: string;
  plannedSessions: number;
  prescription: PrescriptionItem[];
  advice: string;
  followUpDate: ISODate | null;
  notes: string;
}

export interface ConsultationWithRelations extends Consultation {
  patient: PatientRef;
  provider: MemberRef;
}

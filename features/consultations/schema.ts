import { z } from "zod";

import { today } from "@/lib/dates";
import { definedOnly } from "@/lib/object";
import { isoDate, optionalText, requiredNumber, requiredText, selectOne } from "@/lib/validation";
import type { ConsultationInput } from "@/services/consultationService";
import { VISIT_TYPES, type Consultation } from "@/types";

const vital = (label: string, min: number, max: number) =>
  z
    .number()
    .nullable()
    .refine((value) => value === null || (value >= min && value <= max), `${label} must be between ${min} and ${max}`);

const prescriptionItem = z.object({
  id: z.string(),
  name: requiredText("Name", 120),
  dosage: optionalText(80),
  frequency: optionalText(80),
  duration: optionalText(60),
  instructions: optionalText(200),
});

export const consultationSchema = z
  .object({
    patientId: z.string().min(1, "Select a patient"),
    providerId: z.string().min(1, "Select a provider"),
    branchId: z.string().min(1, "Select a branch"),
    appointmentId: z.string(),
    date: isoDate("Consultation date"),
    visitType: selectOne(VISIT_TYPES, "Visit type"),
    chiefComplaint: requiredText("Chief complaint", 300),
    history: optionalText(1500),
    medicalHistory: optionalText(1000),
    surgicalHistory: optionalText(500),
    familyHistory: optionalText(500),
    allergies: optionalText(200),
    currentMedications: optionalText(500),
    vitals: z.object({
      bpSystolic: vital("Systolic BP", 50, 260),
      bpDiastolic: vital("Diastolic BP", 30, 160),
      pulse: vital("Pulse", 20, 220),
      temperature: vital("Temperature", 90, 110),
      spo2: vital("SpO2", 50, 100),
      respiratoryRate: vital("Respiratory rate", 5, 60),
      weight: vital("Weight", 1, 400),
      height: vital("Height", 30, 250),
    }),
    examination: optionalText(1500),
    findings: optionalText(1500),
    templateId: z.string(),
    customFields: z.record(z.string(), z.union([z.string(), z.number(), z.null()])),
    assessment: optionalText(1500),
    diagnosis: requiredText("Diagnosis", 200),
    treatmentPlan: optionalText(1500),
    plannedSessions: requiredNumber("Planned sessions", { min: 0, max: 100, integer: true }),
    prescription: z.array(prescriptionItem),
    advice: optionalText(1000),
    followUpDate: z.string(),
    notes: optionalText(1500),
  })
  .refine((v) => v.followUpDate === "" || v.followUpDate >= v.date, { path: ["followUpDate"], message: "Follow-up must be on or after the consultation date" });

export type ConsultationFormValues = z.infer<typeof consultationSchema>;

export const EMPTY_VITALS: ConsultationFormValues["vitals"] = { bpSystolic: null, bpDiastolic: null, pulse: null, temperature: null, spo2: null, respiratoryRate: null, weight: null, height: null };

export function emptyConsultationValues(defaults: Partial<ConsultationFormValues> = {}): ConsultationFormValues {
  return {
    patientId: "",
    providerId: "",
    branchId: "",
    appointmentId: "",
    date: today(),
    visitType: "New",
    chiefComplaint: "",
    history: "",
    medicalHistory: "",
    surgicalHistory: "",
    familyHistory: "",
    allergies: "",
    currentMedications: "",
    vitals: { ...EMPTY_VITALS },
    examination: "",
    findings: "",
    templateId: "",
    customFields: {},
    assessment: "",
    diagnosis: "",
    treatmentPlan: "",
    plannedSessions: 0,
    prescription: [],
    advice: "",
    followUpDate: "",
    notes: "",
    ...definedOnly(defaults),
  };
}

export function consultationToFormValues(consultation: Consultation): ConsultationFormValues {
  return {
    ...emptyConsultationValues(),
    patientId: consultation.patientId,
    providerId: consultation.providerId,
    branchId: consultation.branchId,
    appointmentId: consultation.appointmentId ?? "",
    date: consultation.date,
    visitType: consultation.visitType,
    chiefComplaint: consultation.chiefComplaint,
    history: consultation.history,
    medicalHistory: consultation.medicalHistory,
    surgicalHistory: consultation.surgicalHistory,
    familyHistory: consultation.familyHistory,
    allergies: consultation.allergies,
    currentMedications: consultation.currentMedications,
    vitals: { ...consultation.vitals },
    examination: consultation.examination,
    findings: consultation.findings,
    templateId: consultation.templateId,
    customFields: { ...consultation.customFields },
    assessment: consultation.assessment,
    diagnosis: consultation.diagnosis,
    treatmentPlan: consultation.treatmentPlan,
    plannedSessions: consultation.plannedSessions,
    prescription: consultation.prescription.map((item) => ({ ...item })),
    advice: consultation.advice,
    followUpDate: consultation.followUpDate ?? "",
    notes: consultation.notes,
  };
}

export function formValuesToConsultationInput(values: ConsultationFormValues): ConsultationInput {
  return {
    ...values,
    appointmentId: values.appointmentId || null,
    followUpDate: values.followUpDate || null,
    prescription: values.prescription.map((item, index) => ({ ...item, id: `rx-${index + 1}` })),
  };
}

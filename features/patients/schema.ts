import dayjs from "dayjs";
import { z } from "zod";

import { today } from "@/lib/dates";
import { isoDate, optionalEmail, optionalText, phoneNumber, requiredText, selectOne } from "@/lib/validation";
import type { PatientInput } from "@/services/patientService";
import { BLOOD_GROUPS, GENDERS, ID_TYPES, PATIENT_STATUSES, REFERRAL_SOURCES, type Patient } from "@/types";

const optionalPhone = z
  .string()
  .trim()
  .refine((value) => value === "" || /^(\+?91[\s-]?)?[6-9]\d{4}\s?\d{5}$/.test(value), "Enter a valid 10-digit mobile number");

export const patientSchema = z.object({
  firstName: requiredText("First name", 60),
  middleName: optionalText(60),
  lastName: requiredText("Last name", 60),
  gender: selectOne(GENDERS, "Gender"),
  dateOfBirth: isoDate("Date of birth")
    .refine((value) => !dayjs(value).isAfter(dayjs()), "Date of birth cannot be in the future")
    .refine((value) => dayjs().diff(dayjs(value), "year") <= 120, "Enter a valid date of birth"),
  bloodGroup: selectOne(BLOOD_GROUPS, "Blood group"),
  photo: z.string().nullable(),
  occupation: optionalText(80),
  phone: phoneNumber(),
  alternatePhone: optionalPhone,
  email: optionalEmail,
  address: z.object({
    line: optionalText(200),
    city: optionalText(60),
    state: optionalText(60),
    country: optionalText(60),
    pincode: z.string().trim().refine((value) => value === "" || /^[A-Za-z0-9 -]{4,10}$/.test(value), "Enter a valid postal code"),
  }),
  emergencyContact: z.object({
    name: requiredText("Contact name", 80),
    relation: requiredText("Relation", 40),
    phone: phoneNumber("Contact number"),
  }),
  medical: z.object({
    primaryCondition: optionalText(160),
    currentCondition: optionalText(500),
    existingConditions: optionalText(500),
    medicalHistory: optionalText(1000),
    surgicalHistory: optionalText(500),
    familyHistory: optionalText(500),
    allergies: optionalText(200),
    currentMedications: optionalText(500),
    lifestyle: optionalText(300),
  }),
  referral: z.object({ source: selectOne(REFERRAL_SOURCES, "Referral source"), detail: optionalText(120) }),
  insurance: z.object({ provider: optionalText(80), policyNumber: optionalText(60), validTill: z.string() }),
  identification: z.object({ type: z.union([z.enum(ID_TYPES), z.literal("")]), number: optionalText(40) }),
  consent: z.object({ treatment: z.boolean(), communication: z.boolean(), date: z.string() }),
  primaryProviderId: z.string().min(1, "Select a provider"),
  branchId: z.string().min(1, "Select a branch"),
  status: selectOne(PATIENT_STATUSES, "Status"),
  registeredOn: isoDate("Registration date"),
  notes: optionalText(1000),
});

export type PatientFormValues = z.infer<typeof patientSchema>;

export function emptyPatientValues(defaults: { providerId?: string; branchId?: string; city?: string; state?: string; country?: string } = {}): PatientFormValues {
  return {
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "Male",
    dateOfBirth: "",
    bloodGroup: "Unknown",
    photo: null,
    occupation: "",
    phone: "",
    alternatePhone: "",
    email: "",
    address: { line: "", city: defaults.city ?? "", state: defaults.state ?? "", country: defaults.country ?? "India", pincode: "" },
    emergencyContact: { name: "", relation: "", phone: "" },
    medical: {
      primaryCondition: "",
      currentCondition: "",
      existingConditions: "",
      medicalHistory: "",
      surgicalHistory: "",
      familyHistory: "",
      allergies: "None known",
      currentMedications: "None",
      lifestyle: "",
    },
    referral: { source: "Walk-in", detail: "" },
    insurance: { provider: "", policyNumber: "", validTill: "" },
    identification: { type: "", number: "" },
    consent: { treatment: true, communication: true, date: today() },
    primaryProviderId: defaults.providerId ?? "",
    branchId: defaults.branchId ?? "",
    status: "Active",
    registeredOn: today(),
    notes: "",
  };
}

export function patientToFormValues(patient: Patient): PatientFormValues {
  return {
    firstName: patient.firstName,
    middleName: patient.middleName,
    lastName: patient.lastName,
    gender: patient.gender,
    dateOfBirth: patient.dateOfBirth,
    bloodGroup: patient.bloodGroup,
    photo: patient.photo,
    occupation: patient.occupation,
    phone: patient.phone,
    alternatePhone: patient.alternatePhone,
    email: patient.email,
    address: { ...patient.address },
    emergencyContact: { ...patient.emergencyContact },
    medical: { ...patient.medical },
    referral: { ...patient.referral },
    insurance: { ...patient.insurance },
    identification: { ...patient.identification },
    consent: { ...patient.consent },
    primaryProviderId: patient.primaryProviderId,
    branchId: patient.branchId,
    status: patient.status,
    registeredOn: patient.registeredOn,
    notes: patient.notes,
  };
}

export function formValuesToPatientInput(values: PatientFormValues): PatientInput {
  return { ...values, insurance: { ...values.insurance, validTill: values.insurance.validTill || "" }, consent: { ...values.consent, date: values.consent.date || "" } };
}

"use client";

import {
  BadgeOutlined,
  ContactPhoneOutlined,
  HealthAndSafetyOutlined,
  MedicalInformationOutlined,
  NotesOutlined,
  PersonOutlined,
  VerifiedUserOutlined,
} from "@mui/icons-material";
import { Stack } from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { useForm, useWatch } from "react-hook-form";

import { FieldSpan, FormActions, FormCheckbox, FormSection, FormTextField, PhotoField } from "@/components/forms";
import { useBranches } from "@/hooks/useClinic";
import { useProviders } from "@/hooks/useMembers";
import { BLOOD_GROUPS, GENDERS, ID_TYPES, PATIENT_STATUSES, REFERRAL_SOURCES } from "@/types";

import { patientSchema, type PatientFormValues } from "./schema";

const RELATIONS = ["Spouse", "Wife", "Husband", "Father", "Mother", "Son", "Daughter", "Brother", "Sister", "Guardian", "Friend", "Other"];

interface PatientFormProps {
  defaultValues: PatientFormValues;
  submitLabel: string;
  onSubmit: (values: PatientFormValues) => Promise<unknown>;
  onCancel: () => void;
}

export default function PatientForm({ defaultValues, submitLabel, onSubmit, onCancel }: PatientFormProps) {
  const { data: providers = [] } = useProviders();
  const { data: branches = [] } = useBranches();
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<PatientFormValues>({ resolver: zodResolver(patientSchema), defaultValues, mode: "onTouched" });
  const dob = useWatch({ control, name: "dateOfBirth" });
  const age = dob ? dayjs().diff(dayjs(dob), "year") : null;

  return (
    <Stack component="form" spacing={3} noValidate onSubmit={handleSubmit(onSubmit)}>
      <FormSection title="Personal Information" description="Basic demographic details" icon={<PersonOutlined />} columns={3}>
        <FieldSpan>
          <PhotoField control={control} name="photo" label="Patient photo" />
        </FieldSpan>
        <FormTextField control={control} name="firstName" label="First name" required autoFocus />
        <FormTextField control={control} name="middleName" label="Middle name" />
        <FormTextField control={control} name="lastName" label="Last name" required />
        <FormTextField control={control} name="dateOfBirth" label="Date of birth" type="date" required helperText={age !== null && age >= 0 ? `Age: ${age} years` : undefined} />
        <FormTextField control={control} name="gender" label="Gender" required options={GENDERS} />
        <FormTextField control={control} name="bloodGroup" label="Blood group" options={BLOOD_GROUPS} />
        <FormTextField control={control} name="occupation" label="Occupation" />
      </FormSection>

      <FormSection title="Contact Information" icon={<ContactPhoneOutlined />} columns={3}>
        <FormTextField control={control} name="phone" label="Mobile number" required type="tel" placeholder="+91 98765 43210" />
        <FormTextField control={control} name="alternatePhone" label="Alternate mobile" type="tel" />
        <FormTextField control={control} name="email" label="Email" type="email" />
        <FieldSpan>
          <FormTextField control={control} name="address.line" label="Address" placeholder="House no., street, area" />
        </FieldSpan>
        <FormTextField control={control} name="address.city" label="City" />
        <FormTextField control={control} name="address.state" label="State" />
        <FormTextField control={control} name="address.country" label="Country" />
        <FormTextField control={control} name="address.pincode" label="PIN / postal code" />
      </FormSection>

      <FormSection title="Emergency Contact" icon={<HealthAndSafetyOutlined />} columns={3}>
        <FormTextField control={control} name="emergencyContact.name" label="Contact name" required />
        <FormTextField control={control} name="emergencyContact.relation" label="Relation" required options={RELATIONS} />
        <FormTextField control={control} name="emergencyContact.phone" label="Contact number" required type="tel" />
      </FormSection>

      <FormSection title="Medical Information" description="Clinical background shared by every specialty" icon={<MedicalInformationOutlined />}>
        <FormTextField control={control} name="medical.primaryCondition" label="Primary condition / reason for visit" />
        <FormTextField control={control} name="medical.existingConditions" label="Existing conditions" placeholder="Diabetes, hypertension…" />
        <FormTextField control={control} name="medical.allergies" label="Allergies" />
        <FormTextField control={control} name="medical.currentMedications" label="Current medications" />
        <FieldSpan>
          <FormTextField control={control} name="medical.medicalHistory" label="Medical history" multiline minRows={2} />
        </FieldSpan>
        <FormTextField control={control} name="medical.surgicalHistory" label="Surgical history" />
        <FormTextField control={control} name="medical.familyHistory" label="Family history" />
        <FormTextField control={control} name="medical.lifestyle" label="Lifestyle" placeholder="Activity, diet, smoking, alcohol…" />
        <FormTextField control={control} name="medical.currentCondition" label="Current status" />
      </FormSection>

      <FormSection title="Referral, Insurance & Identification" icon={<BadgeOutlined />} columns={3}>
        <FormTextField control={control} name="referral.source" label="Referral source" options={REFERRAL_SOURCES} />
        <FormTextField control={control} name="referral.detail" label="Referral detail" placeholder="Referring doctor, patient name…" />
        <FormTextField control={control} name="insurance.provider" label="Insurance provider" />
        <FormTextField control={control} name="insurance.policyNumber" label="Policy number" />
        <FormTextField control={control} name="insurance.validTill" label="Policy valid till" type="date" />
        <FormTextField control={control} name="identification.type" label="ID type" options={[{ value: "", label: "—" }, ...ID_TYPES.map((t) => ({ value: t, label: t }))]} />
        <FormTextField control={control} name="identification.number" label="ID number" />
      </FormSection>

      <FormSection title="Consent" icon={<VerifiedUserOutlined />} columns={3}>
        <FormCheckbox control={control} name="consent.treatment" label="Consent to examination & treatment" />
        <FormCheckbox control={control} name="consent.communication" label="Agrees to WhatsApp / SMS communication" />
        <FormTextField control={control} name="consent.date" label="Consent date" type="date" />
      </FormSection>

      <FormSection title="Registration & Notes" icon={<NotesOutlined />} columns={3}>
        <FormTextField control={control} name="registeredOn" label="Registration date" type="date" required />
        <FormTextField control={control} name="branchId" label="Branch" required options={branches.map((b) => ({ value: b.id, label: b.name }))} />
        <FormTextField control={control} name="primaryProviderId" label="Primary provider" required options={providers.map((p) => ({ value: p.id, label: p.name }))} />
        <FormTextField control={control} name="status" label="Status" options={PATIENT_STATUSES} />
        <FieldSpan>
          <FormTextField control={control} name="notes" label="Notes" multiline minRows={2} placeholder="Preferences, special requirements…" />
        </FieldSpan>
      </FormSection>

      <FormActions submitting={isSubmitting} submitLabel={submitLabel} onCancel={onCancel} onReset={() => reset(defaultValues)} isDirty={isDirty} />
    </Stack>
  );
}

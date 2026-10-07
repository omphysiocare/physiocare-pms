"use client";

import { EventNoteOutlined, NotesOutlined, PersonOutlined } from "@mui/icons-material";
import { Stack } from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { FieldSpan, FormActions, FormSection, FormTextField, PatientSelectField, PatientSummaryCard } from "@/components/forms";
import { useBranches, useCatalog, useClinic } from "@/hooks/useClinic";
import { useProviders } from "@/hooks/useMembers";
import { addMinutesToTime } from "@/lib/format";
import { appointmentTypesFor } from "@/lib/specialties";
import { APPOINTMENT_STATUSES } from "@/types";

import { appointmentSchema, type AppointmentFormValues } from "./schema";

interface AppointmentFormProps {
  defaultValues: AppointmentFormValues;
  submitLabel: string;
  onSubmit: (values: AppointmentFormValues) => Promise<unknown>;
  onCancel: () => void;
}

export default function AppointmentForm({ defaultValues, submitLabel, onSubmit, onCancel }: AppointmentFormProps) {
  const { data: providers = [] } = useProviders();
  const { data: branches = [] } = useBranches();
  const { data: catalog = [] } = useCatalog();
  const { data: clinic } = useClinic();
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { isSubmitting, isDirty },
  } = useForm<AppointmentFormValues>({ resolver: zodResolver(appointmentSchema), defaultValues, mode: "onTouched" });
  const patientId = useWatch({ control, name: "patientId" });
  const types = Array.from(new Set([...appointmentTypesFor(clinic?.specialties ?? ["physiotherapy"]), defaultValues.type].filter(Boolean)));

  return (
    <Stack component="form" spacing={3} noValidate onSubmit={handleSubmit(onSubmit)}>
      <FormSection title="Patient" icon={<PersonOutlined />}>
        <PatientSelectField
          control={control}
          name="patientId"
          onPatientChange={(patient) => {
            if (!patient) return;
            if (!getValues("providerId")) setValue("providerId", patient.primaryProviderId, { shouldValidate: true });
            if (!getValues("branchId")) setValue("branchId", patient.branchId, { shouldValidate: true });
          }}
        />
        <PatientSummaryCard patientId={patientId} />
      </FormSection>

      <FormSection title="Appointment Details" icon={<EventNoteOutlined />} columns={3}>
        <FormTextField control={control} name="date" label="Date" type="date" required />
        <FormTextField
          control={control}
          name="startTime"
          label="Start time"
          type="time"
          required
          onValueChange={(value) => {
            const service = catalog.find((item) => item.id === getValues("serviceId"));
            setValue("endTime", addMinutesToTime(String(value), service?.durationMinutes ?? clinic?.appointmentSettings.slotDurationMinutes ?? 30), { shouldValidate: true });
          }}
        />
        <FormTextField control={control} name="endTime" label="End time" type="time" required />
        <FormTextField control={control} name="type" label="Appointment type" required options={types} />
        <FormTextField
          control={control}
          name="serviceId"
          label="Clinical service"
          options={[{ value: "", label: "Not specified" }, ...catalog.filter((s) => s.active).map((s) => ({ value: s.id, label: `${s.name} (${s.durationMinutes} min)` }))]}
          onValueChange={(value) => {
            const service = catalog.find((item) => item.id === value);
            if (service) setValue("endTime", addMinutesToTime(getValues("startTime"), service.durationMinutes), { shouldValidate: true });
          }}
        />
        <FormTextField control={control} name="providerId" label="Provider" required options={providers.map((p) => ({ value: p.id, label: p.name }))} />
        <FormTextField control={control} name="branchId" label="Branch / location" required options={branches.filter((b) => b.active).map((b) => ({ value: b.id, label: b.name }))} />
        <FormTextField control={control} name="location" label="Room / chair" placeholder="e.g. Room 1" />
        <FormTextField control={control} name="status" label="Status" required options={APPOINTMENT_STATUSES} />
      </FormSection>

      <FormSection title="Reason & Notes" icon={<NotesOutlined />} columns={1}>
        <FormTextField control={control} name="reason" label="Reason for visit" required />
        <FieldSpan>
          <FormTextField control={control} name="notes" label="Notes" multiline minRows={3} placeholder="Instructions for the patient or front desk" />
        </FieldSpan>
      </FormSection>

      <FormActions submitting={isSubmitting} submitLabel={submitLabel} onCancel={onCancel} onReset={() => reset(defaultValues)} isDirty={isDirty} />
    </Stack>
  );
}

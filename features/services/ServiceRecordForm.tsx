"use client";

import { AutoFixHighOutlined, NotesOutlined, PersonOutlined, SelfImprovementOutlined, TuneOutlined } from "@mui/icons-material";
import { Alert, Button, Stack } from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm, useWatch, type Control, type UseFormSetValue } from "react-hook-form";

import { AppointmentSelectField, ClinicalFields, FieldSpan, FormActions, FormSection, FormTextField, PatientSelectField, PatientSummaryCard } from "@/components/forms";
import { useBranches, useCatalog, useClinic, useTerminology } from "@/hooks/useClinic";
import { useConsultations } from "@/hooks/useConsultations";
import { useMembers, useProviders } from "@/hooks/useMembers";
import { useServiceRecords } from "@/hooks/useServiceRecords";
import { formatCurrency, formatDate } from "@/lib/format";
import { getSpecialty } from "@/lib/specialties";
import { SERVICE_RECORD_STATUSES, type ClinicalService } from "@/types";

import { serviceRecordSchema, type ServiceRecordFormValues } from "./schema";
import { suggestNextSession } from "./sessionPlan";

function PlanSuggestion({ patientId, consultationId, catalog, setValue }: { patientId: string; consultationId: string; catalog: ClinicalService[]; setValue: UseFormSetValue<ServiceRecordFormValues> }) {
  const { data: consultations = [] } = useConsultations(patientId || "__none__");
  const { data: records = [] } = useServiceRecords(patientId || "__none__");
  const suggestion = useMemo(() => (patientId ? suggestNextSession(consultations, records, consultationId || undefined) : null), [patientId, consultations, records, consultationId]);
  if (!suggestion) return null;
  const apply = () => {
    const opts = { shouldDirty: true, shouldValidate: true };
    setValue("consultationId", suggestion.consultationId, opts);
    setValue("sessionNumber", suggestion.sessionNumber, opts);
    setValue("totalSessions", suggestion.totalSessions, opts);
    if (suggestion.area) setValue("area", suggestion.area, opts);
    const service = catalog.find((s) => s.id === suggestion.serviceId);
    if (service) {
      setValue("serviceId", service.id, opts);
      setValue("serviceName", service.name, opts);
      setValue("amount", service.price, opts);
      setValue("durationMinutes", service.durationMinutes, opts);
    }
  };
  return (
    <FieldSpan>
      <Alert severity="info" icon={<AutoFixHighOutlined />} action={<Button color="inherit" size="small" onClick={apply}>Apply</Button>}>
        Plan {suggestion.consultationId} ({suggestion.diagnosis}): next is session {suggestion.sessionNumber} of {suggestion.totalSessions}.
      </Alert>
    </FieldSpan>
  );
}

function PlanSelect({ control, patientId }: { control: Control<ServiceRecordFormValues>; patientId: string }) {
  const { data: consultations = [] } = useConsultations(patientId || "__none__");
  return (
    <FormTextField
      control={control}
      name="consultationId"
      label="Plan of care (consultation)"
      disabled={!patientId}
      options={[{ value: "", label: "Not linked" }, ...consultations.map((c) => ({ value: c.id, label: `${c.id} · ${formatDate(c.date)} · ${c.diagnosis}` }))]}
    />
  );
}

interface ServiceRecordFormProps {
  defaultValues: ServiceRecordFormValues;
  submitLabel: string;
  onSubmit: (values: ServiceRecordFormValues) => Promise<unknown>;
  onCancel: () => void;
}

export default function ServiceRecordForm({ defaultValues, submitLabel, onSubmit, onCancel }: ServiceRecordFormProps) {
  const terms = useTerminology();
  const { data: providers = [] } = useProviders();
  const { data: members = [] } = useMembers();
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
  } = useForm<ServiceRecordFormValues>({ resolver: zodResolver(serviceRecordSchema), defaultValues, mode: "onTouched" });
  const [patientId, consultationId, amount, providerId] = useWatch({ control, name: ["patientId", "consultationId", "amount", "providerId"] });
  const specialty = members.find((m) => m.id === providerId)?.specialty || clinic?.primarySpecialty;
  const extraFields = getSpecialty(specialty).serviceRecordFields;

  return (
    <Stack component="form" spacing={3} noValidate onSubmit={handleSubmit(onSubmit)}>
      <FormSection title="Patient & Plan" icon={<PersonOutlined />}>
        <PatientSelectField
          control={control}
          name="patientId"
          onPatientChange={(patient) => {
            setValue("appointmentId", "");
            setValue("consultationId", "");
            if (!patient) return;
            if (!getValues("providerId")) setValue("providerId", patient.primaryProviderId, { shouldValidate: true });
            if (!getValues("branchId")) setValue("branchId", patient.branchId, { shouldValidate: true });
          }}
        />
        <PatientSummaryCard patientId={patientId} />
        <PlanSelect control={control} patientId={patientId} />
        <AppointmentSelectField control={control} name="appointmentId" patientId={patientId} />
        <PlanSuggestion patientId={patientId} consultationId={consultationId} catalog={catalog} setValue={setValue} />
      </FormSection>

      <FormSection title={terms.serviceRecord} icon={<SelfImprovementOutlined />} columns={3}>
        <FormTextField
          control={control}
          name="serviceId"
          label={terms.service}
          required
          options={catalog.filter((s) => s.active || s.id === defaultValues.serviceId).map((s) => ({ value: s.id, label: `${s.name} · ${formatCurrency(s.price)}` }))}
          onValueChange={(value) => {
            const service = catalog.find((s) => s.id === value);
            if (!service) return;
            setValue("serviceName", service.name);
            setValue("amount", service.price, { shouldDirty: true, shouldValidate: true });
            setValue("durationMinutes", service.durationMinutes, { shouldDirty: true });
          }}
        />
        <FormTextField control={control} name="area" label={terms.area} />
        <FormTextField control={control} name="providerId" label={terms.provider} required options={providers.map((p) => ({ value: p.id, label: p.name }))} />
        <FormTextField control={control} name="sessionNumber" label="Session number" type="number" required />
        <FormTextField control={control} name="totalSessions" label="Planned sessions" type="number" required />
        <FormTextField control={control} name="status" label="Status" required options={SERVICE_RECORD_STATUSES} />
        <FormTextField control={control} name="date" label="Date" type="date" required />
        <FormTextField control={control} name="startTime" label="Start time" type="time" required />
        <FormTextField control={control} name="durationMinutes" label="Duration (min)" type="number" required />
        <FormTextField control={control} name="amount" label="Fee (₹)" type="number" required helperText={typeof amount === "number" ? formatCurrency(amount) : undefined} />
        <FormTextField control={control} name="branchId" label="Branch" required options={branches.map((b) => ({ value: b.id, label: b.name }))} />
      </FormSection>

      {extraFields.length > 0 && (
        <FormSection title="Outcome" description={`${getSpecialty(specialty).name} fields`} icon={<TuneOutlined />}>
          <ClinicalFields control={control} fields={extraFields} prefix="customFields" />
        </FormSection>
      )}

      <FormSection title="Notes" icon={<NotesOutlined />} columns={1}>
        <FormTextField control={control} name="notes" label="Session notes" multiline minRows={3} placeholder="Technique, materials, patient response, home advice" />
      </FormSection>

      <FormActions submitting={isSubmitting} submitLabel={submitLabel} onCancel={onCancel} onReset={() => reset(defaultValues)} isDirty={isDirty} />
    </Stack>
  );
}

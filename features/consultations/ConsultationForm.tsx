"use client";

import {
  Add,
  AssignmentOutlined,
  DeleteOutlined,
  FactCheckOutlined,
  HealingOutlined,
  HistoryEduOutlined,
  MedicationOutlined,
  MonitorHeartOutlined,
  PersonOutlined,
  ScienceOutlined,
  TuneOutlined,
} from "@mui/icons-material";
import { Alert, Box, Button, Divider, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

import { AppointmentSelectField, ClinicalFields, FieldSpan, FormActions, FormSection, FormTextField, PatientSelectField, PatientSummaryCard } from "@/components/forms";
import { useBranches, useClinic, useTerminology } from "@/hooks/useClinic";
import { useProviders } from "@/hooks/useMembers";
import { bmiCategory, calculateBmi } from "@/lib/clinical";
import { SPECIALTIES, getTemplate } from "@/lib/specialties";
import { VISIT_TYPES } from "@/types";

import { consultationSchema, type ConsultationFormValues } from "./schema";

interface ConsultationFormProps {
  defaultValues: ConsultationFormValues;
  submitLabel: string;
  onSubmit: (values: ConsultationFormValues) => Promise<unknown>;
  onCancel: () => void;
}

let rxCounter = 0;

export default function ConsultationForm({ defaultValues, submitLabel, onSubmit, onCancel }: ConsultationFormProps) {
  const terms = useTerminology();
  const { data: providers = [] } = useProviders();
  const { data: branches = [] } = useBranches();
  const { data: clinic } = useClinic();
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { isSubmitting, isDirty },
  } = useForm<ConsultationFormValues>({ resolver: zodResolver(consultationSchema), defaultValues, mode: "onTouched" });
  const { fields, append, remove } = useFieldArray({ control, name: "prescription" });
  const [patientId, templateId, weight, height] = useWatch({ control, name: ["patientId", "templateId", "vitals.weight", "vitals.height"] });
  const template = getTemplate(templateId);
  const bmi = calculateBmi({ weight, height });
  // The clinic's own specialties first, then every other template.
  const clinicSpecialties: string[] = clinic ? [clinic.primarySpecialty, ...clinic.specialties] : [];
  const templates = Object.values(SPECIALTIES)
    .map((config) => config.consultationTemplate)
    .filter((item) => item.sections.length > 0)
    .sort((a, b) => Number(clinicSpecialties.includes(b.specialty)) - Number(clinicSpecialties.includes(a.specialty)));

  return (
    <Stack component="form" spacing={3} noValidate onSubmit={handleSubmit(onSubmit)}>
      <FormSection title="Patient & Visit" icon={<PersonOutlined />}>
        <PatientSelectField
          control={control}
          name="patientId"
          onPatientChange={(patient) => {
            setValue("appointmentId", "");
            if (!patient) return;
            if (!getValues("providerId")) setValue("providerId", patient.primaryProviderId, { shouldValidate: true });
            if (!getValues("branchId")) setValue("branchId", patient.branchId, { shouldValidate: true });
            // Carry the patient's background into the consultation (editable).
            if (!getValues("medicalHistory")) setValue("medicalHistory", patient.medical.medicalHistory);
            if (!getValues("surgicalHistory")) setValue("surgicalHistory", patient.medical.surgicalHistory);
            if (!getValues("familyHistory")) setValue("familyHistory", patient.medical.familyHistory);
            if (!getValues("allergies")) setValue("allergies", patient.medical.allergies);
            if (!getValues("currentMedications")) setValue("currentMedications", patient.medical.currentMedications);
          }}
        />
        <PatientSummaryCard patientId={patientId} />
        <FormTextField control={control} name="date" label="Date" type="date" required />
        <FormTextField control={control} name="visitType" label="Visit type" options={VISIT_TYPES} />
        <FormTextField control={control} name="providerId" label={terms.provider} required options={providers.map((p) => ({ value: p.id, label: p.name }))} />
        <FormTextField control={control} name="branchId" label="Branch" required options={branches.map((b) => ({ value: b.id, label: b.name }))} />
        <FieldSpan>
          <AppointmentSelectField control={control} name="appointmentId" patientId={patientId} />
        </FieldSpan>
      </FormSection>

      <FormSection title="Complaint & History" icon={<AssignmentOutlined />}>
        <FieldSpan>
          <FormTextField control={control} name="chiefComplaint" label="Chief complaint" required />
        </FieldSpan>
        <FieldSpan>
          <FormTextField control={control} name="history" label="History of present illness" multiline minRows={3} placeholder="Onset, duration, progression, aggravating / relieving factors" />
        </FieldSpan>
        <FormTextField control={control} name="medicalHistory" label="Medical history" multiline minRows={2} />
        <FormTextField control={control} name="surgicalHistory" label="Surgical history" multiline minRows={2} />
        <FormTextField control={control} name="familyHistory" label="Family history" />
        <FormTextField control={control} name="allergies" label="Allergies" />
        <FieldSpan>
          <FormTextField control={control} name="currentMedications" label="Current medications" />
        </FieldSpan>
      </FormSection>

      <FormSection title="Vitals" icon={<MonitorHeartOutlined />} columns={3}>
        <FormTextField control={control} name="vitals.bpSystolic" label="BP systolic (mmHg)" type="number" />
        <FormTextField control={control} name="vitals.bpDiastolic" label="BP diastolic (mmHg)" type="number" />
        <FormTextField control={control} name="vitals.pulse" label="Pulse (bpm)" type="number" />
        <FormTextField control={control} name="vitals.temperature" label="Temperature (°F)" type="number" />
        <FormTextField control={control} name="vitals.spo2" label="SpO2 (%)" type="number" />
        <FormTextField control={control} name="vitals.respiratoryRate" label="Respiratory rate (/min)" type="number" />
        <FormTextField control={control} name="vitals.weight" label="Weight (kg)" type="number" />
        <FormTextField control={control} name="vitals.height" label="Height (cm)" type="number" />
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "grey.50", border: 1, borderColor: "divider" }}>
          <Typography variant="caption" color="text.secondary">
            BMI (calculated)
          </Typography>
          <Typography sx={{ fontWeight: 700 }}>{bmi ? `${bmi} · ${bmiCategory(bmi)}` : "—"}</Typography>
        </Box>
      </FormSection>

      <FormSection title="Examination & Findings" icon={<ScienceOutlined />}>
        <FormTextField control={control} name="examination" label="Examination" multiline minRows={3} />
        <FormTextField control={control} name="findings" label="Clinical findings" multiline minRows={3} />
      </FormSection>

      <FormSection
        title={template ? template.name : "Specialty assessment"}
        description="Configurable fields for your specialty"
        icon={<TuneOutlined />}
        action={
          <Box sx={{ minWidth: 220 }}>
            <FormTextField
              control={control}
              name="templateId"
              label="Template"
              options={[{ value: "", label: "None" }, ...templates.map((item) => ({ value: item.id, label: item.name }))]}
            />
          </Box>
        }
      >
        {template ? (
          template.sections.map((section) => (
            <Box key={section.title} sx={{ gridColumn: "1 / -1", display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
              <Typography variant="subtitle2" sx={{ gridColumn: "1 / -1" }}>
                {section.title}
              </Typography>
              <ClinicalFields control={control} fields={section.fields} prefix="customFields" />
            </Box>
          ))
        ) : (
          <FieldSpan>
            <Alert severity="info">Choose a template to capture specialty-specific findings (e.g. pain scale, tooth findings, skin lesions, vision).</Alert>
          </FieldSpan>
        )}
      </FormSection>

      <FormSection title="Assessment & Diagnosis" icon={<FactCheckOutlined />}>
        <FieldSpan>
          <FormTextField control={control} name="assessment" label="Assessment" multiline minRows={2} />
        </FieldSpan>
        <FieldSpan>
          <FormTextField control={control} name="diagnosis" label="Diagnosis" required />
        </FieldSpan>
      </FormSection>

      <FormSection title="Plan" icon={<HealingOutlined />}>
        <FieldSpan>
          <FormTextField control={control} name="treatmentPlan" label="Treatment plan" multiline minRows={3} />
        </FieldSpan>
        <FormTextField control={control} name="plannedSessions" label={`Planned ${terms.serviceRecords.toLowerCase()}`} type="number" helperText="0 if no course is planned" />
        <FormTextField control={control} name="followUpDate" label="Follow-up date" type="date" />
      </FormSection>

      <FormSection
        title={terms.prescription}
        description="Medicines, exercises or instructions — printed on the prescription"
        icon={<MedicationOutlined />}
        columns={1}
        action={
          <Button size="small" startIcon={<Add />} onClick={() => append({ id: `new-${++rxCounter}`, name: "", dosage: "", frequency: "", duration: "", instructions: "" })}>
            Add item
          </Button>
        }
      >
        {fields.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No items yet.
          </Typography>
        ) : (
          <Stack spacing={1.5} divider={<Divider flexItem />}>
            {fields.map((field, index) => (
              <Box key={field.id} sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr 1fr", md: "2fr 1fr 1fr 1fr 2fr auto" }, alignItems: "start" }}>
                <Box sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}>
                  <FormTextField control={control} name={`prescription.${index}.name`} label="Name" required />
                </Box>
                <FormTextField control={control} name={`prescription.${index}.dosage`} label="Dosage" />
                <FormTextField control={control} name={`prescription.${index}.frequency`} label="Frequency" />
                <FormTextField control={control} name={`prescription.${index}.duration`} label="Duration" />
                <FormTextField control={control} name={`prescription.${index}.instructions`} label="Instructions" />
                <Tooltip title="Remove">
                  <IconButton onClick={() => remove(index)} aria-label={`Remove item ${index + 1}`}>
                    <DeleteOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Stack>
        )}
      </FormSection>

      <FormSection title="Advice & Notes" icon={<HistoryEduOutlined />}>
        <FormTextField control={control} name="advice" label="Advice to patient" multiline minRows={2} />
        <FormTextField control={control} name="notes" label="Doctor notes (internal)" multiline minRows={2} />
      </FormSection>

      <FormActions submitting={isSubmitting} submitLabel={submitLabel} onCancel={onCancel} onReset={() => reset(defaultValues)} isDirty={isDirty} />
    </Stack>
  );
}

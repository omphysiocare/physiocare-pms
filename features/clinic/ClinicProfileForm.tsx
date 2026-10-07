"use client";

import { Autocomplete, Box, Chip, TextField } from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { useController, useForm } from "react-hook-form";
import { z } from "zod";

import { FieldSpan, FormTextField, PhotoField } from "@/components/forms";
import { useUpdateClinicProfile } from "@/hooks/useClinic";
import { optionalEmail, optionalText, requiredText } from "@/lib/validation";
import { SPECIALTIES, SPECIALTY_OPTIONS } from "@/lib/specialties";
import { useAuth } from "@/providers/AuthProvider";
import { useNotify } from "@/providers/NotificationProvider";
import { CLINIC_TYPES, SPECIALTY_IDS, type Clinic, type ClinicProfileInput, type SpecialtyId } from "@/types";

import SettingsCard from "./SettingsCard";

const schema = z.object({
  name: requiredText("Clinic name", 120),
  logo: z.string().nullable(),
  clinicType: z.enum(CLINIC_TYPES),
  primarySpecialty: z.enum(SPECIALTY_IDS),
  specialties: z.array(z.enum(SPECIALTY_IDS)).min(1, "Select at least one specialty"),
  tagline: optionalText(120),
  registrationNumber: optionalText(60),
  gstin: z.string().trim().refine((v) => v === "" || /^[0-9A-Z]{15}$/.test(v), "GSTIN must be 15 characters (A–Z, 0–9)"),
  phone: requiredText("Phone", 20),
  email: optionalEmail,
  website: optionalText(120),
  address: requiredText("Address", 250),
  city: requiredText("City", 60),
  state: requiredText("State", 60),
  country: requiredText("Country", 60),
  pincode: requiredText("PIN / postal code", 10),
  currency: z.string().min(1),
  timezone: z.string().min(1),
});

function SpecialtiesField({ control }: { control: ReturnType<typeof useForm<ClinicProfileInput>>["control"] }) {
  const { field, fieldState } = useController({ control, name: "specialties" });
  const value = (field.value ?? []) as SpecialtyId[];
  return (
    <Autocomplete
      multiple
      options={[...SPECIALTY_IDS]}
      value={value}
      onChange={(_, next) => field.onChange(next)}
      getOptionLabel={(id) => SPECIALTIES[id].name}
      renderValue={(selected, getItemProps) => selected.map((id, index) => <Chip size="small" label={SPECIALTIES[id].name} {...getItemProps({ index })} key={id} />)}
      renderInput={(params) => <TextField {...params} label="Specialties offered" error={Boolean(fieldState.error)} helperText={fieldState.error?.message ?? "Multi-specialty clinics can add several"} />}
    />
  );
}

export default function ClinicProfileForm({ clinic }: { clinic: Clinic }) {
  const notify = useNotify();
  const { can } = useAuth();
  const update = useUpdateClinicProfile();
  const defaults: ClinicProfileInput = {
    name: clinic.name, logo: clinic.logo, clinicType: clinic.clinicType, primarySpecialty: clinic.primarySpecialty, specialties: clinic.specialties, tagline: clinic.tagline,
    registrationNumber: clinic.registrationNumber, gstin: clinic.gstin, phone: clinic.phone, email: clinic.email, website: clinic.website, address: clinic.address, city: clinic.city,
    state: clinic.state, country: clinic.country, pincode: clinic.pincode, currency: clinic.currency, timezone: clinic.timezone,
  };
  const { control, handleSubmit, reset, formState } = useForm<ClinicProfileInput>({ resolver: zodResolver(schema), defaultValues: defaults });
  const submit = async (values: ClinicProfileInput) => {
    try {
      await update.mutateAsync(values);
      reset(values);
      notify.success("Clinic profile saved");
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <SettingsCard title="Clinic Profile" description="Used on invoices, receipts, prescriptions, reports and WhatsApp messages." onSubmit={handleSubmit(submit)} onReset={() => reset(defaults)} isDirty={formState.isDirty} isSubmitting={formState.isSubmitting} columns={3} readOnly={!can("clinic.edit")}>
      <FieldSpan>
        <PhotoField control={control} name="logo" label="Clinic logo" square />
      </FieldSpan>
      <FormTextField control={control} name="name" label="Clinic name" required />
      <FormTextField control={control} name="clinicType" label="Clinic type" options={CLINIC_TYPES} />
      <FormTextField control={control} name="primarySpecialty" label="Primary specialty" options={SPECIALTY_OPTIONS} helperText="Drives terminology, templates & appointment types" />
      <Box sx={{ gridColumn: "1 / -1" }}>
        <SpecialtiesField control={control} />
      </Box>
      <FormTextField control={control} name="tagline" label="Tagline" />
      <FormTextField control={control} name="registrationNumber" label="Registration / licence no." />
      <FormTextField control={control} name="gstin" label="GSTIN / Tax ID" />
      <FormTextField control={control} name="phone" label="Phone" required />
      <FormTextField control={control} name="email" label="Email" />
      <FormTextField control={control} name="website" label="Website" />
      <FieldSpan>
        <FormTextField control={control} name="address" label="Address" required />
      </FieldSpan>
      <FormTextField control={control} name="city" label="City" required />
      <FormTextField control={control} name="state" label="State" required />
      <FormTextField control={control} name="country" label="Country" required />
      <FormTextField control={control} name="pincode" label="PIN / postal code" required />
      <FormTextField control={control} name="currency" label="Currency" options={[{ value: "INR", label: "Indian Rupee (₹)" }, { value: "USD", label: "US Dollar ($)" }, { value: "AED", label: "UAE Dirham" }]} />
      <FormTextField control={control} name="timezone" label="Time zone" options={[{ value: "Asia/Kolkata", label: "India (UTC+05:30)" }, { value: "Asia/Dubai", label: "Dubai (UTC+04:00)" }, { value: "Europe/London", label: "London" }]} />
    </SettingsCard>
  );
}

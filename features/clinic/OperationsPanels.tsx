"use client";

import { Add, DeleteOutlined } from "@mui/icons-material";
import { Box, Button, Checkbox, IconButton, Stack, TextField, Typography } from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { FieldSpan, FormSwitch, FormTextField } from "@/components/forms";
import { useUpdateClinicSection } from "@/hooks/useClinic";
import { useProviders } from "@/hooks/useMembers";
import { formatDate } from "@/lib/format";
import { optionalText, requiredNumber, requiredText } from "@/lib/validation";
import { useAuth } from "@/providers/AuthProvider";
import { useNotify } from "@/providers/NotificationProvider";
import type { AppointmentSettings, BillingSettings, BrandingSettings, Clinic, Holiday, WorkingDay } from "@/types";

import SettingsCard from "./SettingsCard";

function useSave<K extends "workingHours" | "holidays" | "appointmentSettings" | "billingSettings" | "branding">(section: K, label: string) {
  const notify = useNotify();
  const update = useUpdateClinicSection(section);
  return async (value: Clinic[K]) => {
    try {
      await update.mutateAsync(value);
      notify.success(`${label} saved`);
      return true;
    } catch (error) {
      notify.error(error);
      return false;
    }
  };
}

const hoursSchema = z.object({
  days: z.array(z.object({ day: z.string(), open: z.boolean(), start: z.string(), end: z.string() })).refine((days) => days.every((d) => !d.open || d.end > d.start), "Closing time must be after opening time"),
});

export function WorkingHoursPanel({ clinic }: { clinic: Clinic }) {
  const { can } = useAuth();
  const save = useSave("workingHours", "Working hours");
  const { control, handleSubmit, reset, register, formState } = useForm<{ days: WorkingDay[] }>({ resolver: zodResolver(hoursSchema) as never, defaultValues: { days: clinic.workingHours } });
  const { fields } = useFieldArray({ control, name: "days" });
  const days = useWatch({ control, name: "days" });
  return (
    <SettingsCard title="Working Hours" description="Used for the calendar grid and to warn about bookings outside hours." onSubmit={handleSubmit(async (v) => (await save(v.days)) && reset(v))} onReset={() => reset({ days: clinic.workingHours })} isDirty={formState.isDirty} isSubmitting={formState.isSubmitting} columns={1} readOnly={!can("clinic.edit")}>
      {fields.map((field, index) => (
        <Box key={field.id} sx={{ display: "grid", gridTemplateColumns: { xs: "70px 50px 1fr 1fr", sm: "100px 80px 160px 160px" }, gap: 1.5, alignItems: "center" }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{field.day}</Typography>
          <Checkbox {...register(`days.${index}.open`)} defaultChecked={field.open} slotProps={{ input: { "aria-label": `${field.day} open` } }} />
          <TextField type="time" label="Opens" disabled={!days[index]?.open} {...register(`days.${index}.start`)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField type="time" label="Closes" disabled={!days[index]?.open} {...register(`days.${index}.end`)} slotProps={{ inputLabel: { shrink: true } }} />
        </Box>
      ))}
      {formState.errors.days?.root?.message && <Typography color="error" variant="body2">{formState.errors.days.root.message}</Typography>}
    </SettingsCard>
  );
}

export function HolidaysPanel({ clinic }: { clinic: Clinic }) {
  const { can } = useAuth();
  const notify = useNotify();
  const save = useSave("holidays", "Holidays");
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const holidays = [...clinic.holidays].sort((a, b) => a.date.localeCompare(b.date));
  const add = async () => {
    if (!date || !name.trim()) return notify.error("Enter a date and a name for the holiday.");
    if (holidays.some((h) => h.date === date)) return notify.error("A holiday already exists on this date.");
    const next: Holiday[] = [...holidays, { id: `HOL-${Date.now()}`, date, name: name.trim() }];
    if (await save(next)) {
      setDate("");
      setName("");
    }
  };
  return (
    <SettingsCard title="Holidays" description="Appointments cannot be booked on clinic holidays." columns={1}>
      {can("clinic.edit") && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField type="date" label="Date" value={date} onChange={(e) => setDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Holiday name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button variant="outlined" startIcon={<Add />} onClick={add} sx={{ flexShrink: 0 }}>Add</Button>
        </Stack>
      )}
      {holidays.length === 0 && <Typography variant="body2" color="text.secondary">No holidays configured.</Typography>}
      {holidays.map((holiday) => (
        <Box key={holiday.id} sx={{ display: "flex", alignItems: "center", gap: 2, py: 0.75, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="body2" sx={{ fontWeight: 600, width: 120 }}>{formatDate(holiday.date)}</Typography>
          <Typography variant="body2" sx={{ flex: 1 }}>{holiday.name}</Typography>
          {can("clinic.edit") && <IconButton size="small" aria-label={`Remove ${holiday.name}`} onClick={() => save(holidays.filter((h) => h.id !== holiday.id))}><DeleteOutlined fontSize="small" /></IconButton>}
        </Box>
      ))}
    </SettingsCard>
  );
}

const appointmentSchema = z.object({
  slotDurationMinutes: requiredNumber("Slot duration", { min: 5, max: 240, integer: true }),
  bufferMinutes: requiredNumber("Buffer", { min: 0, max: 60, integer: true }),
  allowOverlapping: z.boolean(),
  defaultProviderId: z.string().min(1, "Select a provider"),
});

export function AppointmentSettingsPanel({ clinic }: { clinic: Clinic }) {
  const { can } = useAuth();
  const { data: providers = [] } = useProviders();
  const save = useSave("appointmentSettings", "Appointment settings");
  const { control, handleSubmit, reset, formState } = useForm<AppointmentSettings>({ resolver: zodResolver(appointmentSchema), defaultValues: clinic.appointmentSettings });
  return (
    <SettingsCard title="Appointment Settings" description="Booking defaults for every branch." onSubmit={handleSubmit(async (v) => (await save(v)) && reset(v))} onReset={() => reset(clinic.appointmentSettings)} isDirty={formState.isDirty} isSubmitting={formState.isSubmitting} readOnly={!can("clinic.edit")}>
      <FormTextField control={control} name="slotDurationMinutes" label="Default appointment length" options={[15, 20, 30, 45, 60].map((m) => ({ value: m, label: `${m} minutes` }))} />
      <FormTextField control={control} name="bufferMinutes" label="Buffer between appointments (min)" type="number" />
      <FormTextField control={control} name="defaultProviderId" label="Default provider" options={providers.map((p) => ({ value: p.id, label: p.name }))} />
      <FieldSpan>
        <FormSwitch control={control} name="allowOverlapping" label="Allow overlapping appointments" description="When off, a provider cannot be double-booked." />
      </FieldSpan>
    </SettingsCard>
  );
}

const billingSchema = z.object({
  invoicePrefix: z.string().trim().regex(/^[A-Z]{2,6}$/, "Use 2–6 capital letters"),
  receiptPrefix: z.string().trim().regex(/^[A-Z]{2,6}$/, "Use 2–6 capital letters"),
  defaultTaxRate: requiredNumber("Tax rate", { min: 0, max: 28 }),
  paymentTermsDays: requiredNumber("Payment terms", { min: 0, max: 90, integer: true }),
  invoiceFooter: optionalText(250),
  termsAndConditions: optionalText(1000),
});

export function BillingSettingsPanel({ clinic }: { clinic: Clinic }) {
  const { can } = useAuth();
  const save = useSave("billingSettings", "Billing settings");
  const { control, handleSubmit, reset, formState } = useForm<BillingSettings>({ resolver: zodResolver(billingSchema), defaultValues: clinic.billingSettings });
  return (
    <SettingsCard title="Billing Settings" description="Numbering, default tax and invoice text." onSubmit={handleSubmit(async (v) => (await save(v)) && reset(v))} onReset={() => reset(clinic.billingSettings)} isDirty={formState.isDirty} isSubmitting={formState.isSubmitting} readOnly={!can("clinic.edit")}>
      <FormTextField control={control} name="invoicePrefix" label="Invoice prefix" required />
      <FormTextField control={control} name="receiptPrefix" label="Receipt prefix" required />
      <FormTextField control={control} name="defaultTaxRate" label="Default tax rate (%)" type="number" helperText="Most healthcare services are GST-exempt" />
      <FormTextField control={control} name="paymentTermsDays" label="Payment terms (days)" type="number" />
      <FieldSpan><FormTextField control={control} name="invoiceFooter" label="Invoice footer" /></FieldSpan>
      <FieldSpan><FormTextField control={control} name="termsAndConditions" label="Terms & conditions" multiline minRows={2} /></FieldSpan>
    </SettingsCard>
  );
}

const brandingSchema = z.object({
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #2563EB"),
  showLogo: z.boolean(),
  signatureLabel: requiredText("Signature label", 60),
});

export function BrandingPanel({ clinic }: { clinic: Clinic }) {
  const { can } = useAuth();
  const save = useSave("branding", "Document branding");
  const { control, handleSubmit, reset, formState } = useForm<BrandingSettings>({ resolver: zodResolver(brandingSchema), defaultValues: clinic.branding });
  const accent = useWatch({ control, name: "accentColor" });
  return (
    <SettingsCard title="Invoice & Document Branding" description="Applied to printed and PDF invoices, receipts, prescriptions and reports." onSubmit={handleSubmit(async (v) => (await save(v)) && reset(v))} onReset={() => reset(clinic.branding)} isDirty={formState.isDirty} isSubmitting={formState.isSubmitting} readOnly={!can("clinic.edit")}>
      <FormTextField control={control} name="accentColor" label="Accent colour" helperText="Header bar and table headings" />
      <FormTextField control={control} name="signatureLabel" label="Signature label" />
      <FormSwitch control={control} name="showLogo" label="Show clinic logo on documents" />
      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ height: 6, bgcolor: /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : "#2563EB" }} />
        <Box sx={{ p: 1.5, display: "flex", justifyContent: "space-between" }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>{clinic.name}</Typography>
          <Typography variant="body2" sx={{ fontWeight: 800, color: /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : "#2563EB" }}>TAX INVOICE</Typography>
        </Box>
      </Box>
    </SettingsCard>
  );
}

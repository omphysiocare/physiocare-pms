"use client";

import { Box, Chip, MenuItem, TextField, Typography } from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useController, useForm } from "react-hook-form";
import { z } from "zod";

import { FormSwitch, FormTextField } from "@/components/forms";
import { useUpdateClinicSection } from "@/hooks/useClinic";
import { DEFAULT_TEMPLATES, MESSAGE_TYPE_LABELS, TEMPLATE_VARIABLES, renderTemplate } from "@/lib/messaging/templates";
import { requiredNumber } from "@/lib/validation";
import { useAuth } from "@/providers/AuthProvider";
import { useNotify } from "@/providers/NotificationProvider";
import { MESSAGE_TYPES, type Clinic, type MessageType, type MessagingSettings } from "@/types";

import SettingsCard from "./SettingsCard";

const schema = z.object({
  whatsappEnabled: z.boolean(),
  whatsappNumber: z.string().trim().min(8, "Enter the clinic's WhatsApp Business number"),
  autoReminders: z.boolean(),
  reminderHoursBefore: requiredNumber("Reminder time", { min: 1, max: 72, integer: true }),
  templates: z.record(z.string(), z.string().min(10, "Template is too short")),
});

const SAMPLE = {
  patientName: "Rajesh", providerName: "Dr. Gopi Mehta", date: "10 October 2026", time: "10:30 AM", appointmentType: "Follow-up", previousDate: "09 October 2026", previousTime: "05:00 PM",
  invoiceNumber: "INV-0123", amount: "₹3,600", balance: "₹1,200", dueDate: "15 October 2026", receiptNumber: "RCPT-0456", paymentMethod: "UPI", followUpDate: "24 October 2026", diagnosis: "Cervical Spondylosis",
};

function TemplateEditor({ control, clinic }: { control: ReturnType<typeof useForm<MessagingSettings>>["control"]; clinic: Clinic }) {
  const [type, setType] = useState<MessageType>("appointment_confirmation");
  const { field, fieldState } = useController({ control, name: `templates.${type}` });
  const value = String(field.value ?? "");
  return (
    <Box sx={{ gridColumn: "1 / -1", display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
      <Box>
        <TextField select label="Message type" value={type} onChange={(e) => setType(e.target.value as MessageType)} sx={{ mb: 2 }}>
          {MESSAGE_TYPES.map((t) => <MenuItem key={t} value={t}>{MESSAGE_TYPE_LABELS[t]}</MenuItem>)}
        </TextField>
        <TextField multiline minRows={9} label="Template" value={value} onChange={(e) => field.onChange(e.target.value)} error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 1 }}>
          {TEMPLATE_VARIABLES.map((v) => <Chip key={v} size="small" label={`{{${v}}}`} onClick={() => field.onChange(`${value}{{${v}}}`)} />)}
        </Box>
        <Typography component="button" type="button" variant="caption" onClick={() => field.onChange(DEFAULT_TEMPLATES[type])} sx={{ mt: 1, border: 0, bgcolor: "transparent", color: "primary.main", cursor: "pointer", p: 0 }}>Restore default template</Typography>
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Preview</Typography>
        <Box sx={{ p: 2, bgcolor: "#E7FFDB", borderRadius: 2, whiteSpace: "pre-line", fontSize: 14, boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
          {renderTemplate(value, { ...SAMPLE, clinicName: clinic.name, clinicPhone: clinic.phone, clinicAddress: `${clinic.address}, ${clinic.city}` })}
        </Box>
      </Box>
    </Box>
  );
}

export default function MessagingPanel({ clinic }: { clinic: Clinic }) {
  const notify = useNotify();
  const { can } = useAuth();
  const update = useUpdateClinicSection("messaging");
  const { control, handleSubmit, reset, formState } = useForm<MessagingSettings>({ resolver: zodResolver(schema) as never, defaultValues: clinic.messaging });
  const submit = async (values: MessagingSettings) => {
    try {
      await update.mutateAsync(values);
      reset(values);
      notify.success("Messaging settings saved");
    } catch (error) {
      notify.error(error);
    }
  };
  return (
    <SettingsCard title="WhatsApp Messaging" description="Templates for one-click messages. Provider: mock today; Meta WhatsApp Cloud API once the backend is connected." onSubmit={handleSubmit(submit)} onReset={() => reset(clinic.messaging)} isDirty={formState.isDirty} isSubmitting={formState.isSubmitting} readOnly={!can("clinic.edit")}>
      <FormSwitch control={control} name="whatsappEnabled" label="WhatsApp messaging enabled" />
      <FormTextField control={control} name="whatsappNumber" label="WhatsApp Business number" />
      <FormSwitch control={control} name="autoReminders" label="Automatic appointment reminders" />
      <FormTextField control={control} name="reminderHoursBefore" label="Send reminders" options={[2, 6, 12, 24, 48].map((h) => ({ value: h, label: `${h} hours before` }))} />
      <TemplateEditor control={control} clinic={clinic} />
    </SettingsCard>
  );
}

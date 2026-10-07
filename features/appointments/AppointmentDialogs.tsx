"use client";

import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, Typography } from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormTextField } from "@/components/forms";
import { useRescheduleAppointment, useUpdateAppointmentStatus } from "@/hooks/useAppointments";
import { useProviders } from "@/hooks/useMembers";
import { useSendWhatsApp } from "@/hooks/useMessaging";
import { today } from "@/lib/dates";
import { formatDate, formatTime } from "@/lib/format";
import { isoDate, optionalText, timeOfDay } from "@/lib/validation";
import { useAuth } from "@/providers/AuthProvider";
import { useNotify } from "@/providers/NotificationProvider";
import type { AppointmentWithRelations } from "@/types";

const rescheduleSchema = z
  .object({
    date: isoDate("Date").refine((value) => value >= today(), "Choose today or a future date"),
    startTime: timeOfDay("Start time"),
    endTime: timeOfDay("End time"),
    providerId: z.string().min(1, "Select a provider"),
    reason: optionalText(200),
  })
  .refine((v) => v.endTime > v.startTime, { path: ["endTime"], message: "End time must be after start time" });
type RescheduleValues = z.infer<typeof rescheduleSchema>;

function NotifyToggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  const { can } = useAuth();
  if (!can("messaging.send")) return null;
  return <FormControlLabel control={<Checkbox checked={checked} onChange={(event) => onChange(event.target.checked)} />} label="Notify the patient on WhatsApp" />;
}

export function RescheduleDialog({ appointment, onClose }: { appointment: AppointmentWithRelations; onClose: () => void }) {
  const notify = useNotify();
  const reschedule = useRescheduleAppointment();
  const send = useSendWhatsApp();
  const { data: providers = [] } = useProviders();
  const [sendMessage, setSendMessage] = useState(true);
  const { control, handleSubmit, formState } = useForm<RescheduleValues>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: { date: appointment.date < today() ? today() : appointment.date, startTime: appointment.startTime, endTime: appointment.endTime, providerId: appointment.providerId, reason: "" },
  });

  const submit = async (values: RescheduleValues) => {
    try {
      await reschedule.mutateAsync({ id: appointment.id, input: values });
      notify.success(`Rescheduled to ${formatDate(values.date)} at ${formatTime(values.startTime)}`);
      if (sendMessage) {
        await send.mutateAsync({ type: "appointment_reschedule", relatedType: "appointment", relatedId: appointment.id, patientId: appointment.patientId }).then(
          () => notify.success("Reschedule message sent on WhatsApp"),
          (error) => notify.error(error),
        );
      }
      onClose();
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <Dialog open onClose={formState.isSubmitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <form noValidate onSubmit={handleSubmit(submit)}>
        <DialogTitle>Reschedule appointment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            {appointment.patient.name} · currently {formatDate(appointment.date)} at {formatTime(appointment.startTime)}
          </Typography>
          <Stack spacing={2.5}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormTextField control={control} name="date" label="New date" type="date" required />
              <FormTextField control={control} name="startTime" label="Start" type="time" required />
              <FormTextField control={control} name="endTime" label="End" type="time" required />
            </Stack>
            <FormTextField control={control} name="providerId" label="Provider" options={providers.map((p) => ({ value: p.id, label: p.name }))} />
            <FormTextField control={control} name="reason" label="Reason (optional)" />
            <NotifyToggle checked={sendMessage} onChange={setSendMessage} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={onClose} disabled={formState.isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={formState.isSubmitting}>
            Reschedule
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

const CANCEL_REASONS = ["Patient request", "Patient unwell", "Provider unavailable", "Clinic closed", "Duplicate booking", "Other"];

export function CancelDialog({ appointment, onClose }: { appointment: AppointmentWithRelations; onClose: () => void }) {
  const notify = useNotify();
  const updateStatus = useUpdateAppointmentStatus();
  const send = useSendWhatsApp();
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const [sendMessage, setSendMessage] = useState(true);
  const { control, handleSubmit, formState } = useForm<{ reason: string }>({ defaultValues: { reason: CANCEL_REASONS[0] } });

  const submit = async () => {
    try {
      await updateStatus.mutateAsync({ id: appointment.id, status: "Cancelled", reason });
      notify.success(`Appointment ${appointment.id} cancelled`);
      if (sendMessage) {
        await send.mutateAsync({ type: "appointment_cancellation", relatedType: "appointment", relatedId: appointment.id, patientId: appointment.patientId }).then(
          () => notify.success("Cancellation message sent on WhatsApp"),
          (error) => notify.error(error),
        );
      }
      onClose();
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <Dialog open onClose={formState.isSubmitting ? undefined : onClose} maxWidth="xs" fullWidth>
      <form noValidate onSubmit={handleSubmit(submit)}>
        <DialogTitle>Cancel appointment?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {appointment.patient.name} · {formatDate(appointment.date)} at {formatTime(appointment.startTime)}
          </Typography>
          <Stack spacing={2}>
            <FormTextField control={control} name="reason" label="Reason" options={CANCEL_REASONS} onValueChange={(value) => setReason(String(value))} />
            <NotifyToggle checked={sendMessage} onChange={setSendMessage} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={onClose} disabled={formState.isSubmitting}>
            Keep appointment
          </Button>
          <Button type="submit" variant="contained" color="error" loading={formState.isSubmitting}>
            Cancel appointment
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

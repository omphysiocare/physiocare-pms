import dayjs from "dayjs";
import { z } from "zod";

import { today } from "@/lib/dates";
import { addMinutesToTime } from "@/lib/format";
import { isoDate, optionalText, requiredText, selectOne, timeOfDay } from "@/lib/validation";
import type { AppointmentInput } from "@/services/appointmentService";
import { APPOINTMENT_STATUSES, type Appointment } from "@/types";

export const appointmentSchema = z
  .object({
    patientId: z.string().min(1, "Select a patient"),
    providerId: z.string().min(1, "Select a provider"),
    branchId: z.string().min(1, "Select a branch"),
    serviceId: z.string(),
    date: isoDate("Date"),
    startTime: timeOfDay("Start time"),
    endTime: timeOfDay("End time"),
    type: requiredText("Appointment type", 60),
    status: selectOne(APPOINTMENT_STATUSES, "Status"),
    reason: requiredText("Reason for visit", 300),
    notes: optionalText(1000),
    location: optionalText(60),
  })
  .refine((v) => v.endTime > v.startTime, { path: ["endTime"], message: "End time must be after start time" })
  .refine((v) => v.status !== "Completed" || !dayjs(v.date).isAfter(dayjs(), "day"), { path: ["status"], message: "A future appointment cannot be completed" });

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;

/** Next half-hour slot from now, clamped to clinic hours. */
export function nextSlot(opening = "09:00", closing = "20:00"): string {
  const now = dayjs();
  const rounded = now.minute() < 30 ? now.minute(30) : now.add(1, "hour").minute(0);
  const slot = rounded.format("HH:mm");
  return slot < opening || slot >= closing ? opening : slot;
}

export function emptyAppointmentValues(defaults: Partial<AppointmentFormValues> & { duration?: number } = {}): AppointmentFormValues {
  const { duration = 30, ...rest } = defaults;
  const startTime = rest.startTime ?? nextSlot();
  return {
    patientId: "",
    providerId: "",
    branchId: "",
    serviceId: "",
    date: today(),
    endTime: addMinutesToTime(startTime, duration),
    type: "New Consultation",
    status: "Scheduled",
    reason: "",
    notes: "",
    location: "",
    ...Object.fromEntries(Object.entries(rest).filter(([, value]) => value !== undefined)),
    startTime,
  };
}

export function appointmentToFormValues(appointment: Appointment): AppointmentFormValues {
  return {
    patientId: appointment.patientId,
    providerId: appointment.providerId,
    branchId: appointment.branchId,
    serviceId: appointment.serviceId ?? "",
    date: appointment.date,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    type: appointment.type,
    status: appointment.status,
    reason: appointment.reason,
    notes: appointment.notes,
    location: appointment.location,
  };
}

export function formValuesToAppointmentInput(values: AppointmentFormValues): AppointmentInput {
  return { ...values, serviceId: values.serviceId || null, cancellationReason: "" };
}

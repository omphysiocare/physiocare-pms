import { z } from "zod";

import { today } from "@/lib/dates";
import { definedOnly } from "@/lib/object";
import { isoDate, optionalText, requiredNumber, selectOne, timeOfDay } from "@/lib/validation";
import type { ServiceRecordInput } from "@/services/serviceRecordService";
import { SERVICE_RECORD_STATUSES, type ServiceRecord } from "@/types";

export const serviceRecordSchema = z
  .object({
    patientId: z.string().min(1, "Select a patient"),
    providerId: z.string().min(1, "Select a provider"),
    branchId: z.string().min(1, "Select a branch"),
    serviceId: z.string().min(1, "Select a service"),
    serviceName: z.string(),
    appointmentId: z.string(),
    consultationId: z.string(),
    date: isoDate("Date"),
    startTime: timeOfDay("Start time"),
    durationMinutes: requiredNumber("Duration", { min: 5, max: 480, integer: true }),
    area: optionalText(100),
    sessionNumber: requiredNumber("Session number", { min: 1, max: 200, integer: true }),
    totalSessions: requiredNumber("Planned sessions", { min: 1, max: 200, integer: true }),
    amount: requiredNumber("Amount", { min: 0, max: 10000000 }),
    status: selectOne(SERVICE_RECORD_STATUSES, "Status"),
    notes: optionalText(1500),
    customFields: z.record(z.string(), z.union([z.string(), z.number(), z.null()])),
  })
  .refine((v) => v.sessionNumber <= v.totalSessions, { path: ["sessionNumber"], message: "Session number cannot exceed planned sessions" });

export type ServiceRecordFormValues = z.infer<typeof serviceRecordSchema>;

export function emptyServiceRecordValues(defaults: Partial<ServiceRecordFormValues> = {}): ServiceRecordFormValues {
  return {
    patientId: "",
    providerId: "",
    branchId: "",
    serviceId: "",
    serviceName: "",
    appointmentId: "",
    consultationId: "",
    date: today(),
    startTime: "10:00",
    durationMinutes: 30,
    area: "",
    sessionNumber: 1,
    totalSessions: 1,
    amount: 0,
    status: "Scheduled",
    notes: "",
    customFields: {},
    ...definedOnly(defaults),
  };
}

export function serviceRecordToFormValues(record: ServiceRecord): ServiceRecordFormValues {
  return {
    patientId: record.patientId,
    providerId: record.providerId,
    branchId: record.branchId,
    serviceId: record.serviceId,
    serviceName: record.serviceName,
    appointmentId: record.appointmentId ?? "",
    consultationId: record.consultationId ?? "",
    date: record.date,
    startTime: record.startTime,
    durationMinutes: record.durationMinutes,
    area: record.area,
    sessionNumber: record.sessionNumber,
    totalSessions: record.totalSessions,
    amount: record.amount,
    status: record.status,
    notes: record.notes,
    customFields: { ...record.customFields },
  };
}

export function formValuesToServiceRecordInput(values: ServiceRecordFormValues): ServiceRecordInput {
  return { ...values, appointmentId: values.appointmentId || null, consultationId: values.consultationId || null };
}

import { http } from "@/lib/api/client";
import { isMockApi } from "@/lib/api/config";
import { ApiError } from "@/lib/api/errors";
import { logActivity } from "@/lib/api/mock/audit";
import { findOrThrow, insertRecord, removeRecord, updateRecord } from "@/lib/api/mock/crud";
import { getDb } from "@/lib/api/mock/db";
import { assertProvider, findPatient, invoiceIdByServiceRecord, patientName, withServiceRecordRelations } from "@/lib/api/mock/relations";
import { run } from "@/lib/api/mock/run";
import { ID_PREFIX } from "@/lib/ids";
import type { CreateInput, ServiceRecord, ServiceRecordStatus, ServiceRecordWithRelations } from "@/types";

import { scopeMatches, type PatientScopedFilters } from "./types";

export type ServiceRecordInput = CreateInput<ServiceRecord>;

/** Clinical services delivered to patients (treatments, procedures, sessions…). */
export interface ServiceRecordService {
  list(filters?: PatientScopedFilters): Promise<ServiceRecordWithRelations[]>;
  get(id: string): Promise<ServiceRecordWithRelations>;
  create(input: ServiceRecordInput): Promise<ServiceRecord>;
  update(id: string, input: ServiceRecordInput): Promise<ServiceRecord>;
  updateStatus(id: string, status: ServiceRecordStatus): Promise<ServiceRecord>;
  remove(id: string): Promise<void>;
}

const RESOURCE = "Service record";

function syncAppointment(record: ServiceRecord) {
  const appointment = getDb().appointments.find((item) => item.id === record.appointmentId);
  if (!appointment) return;
  if (record.status === "Completed" && appointment.status !== "Completed" && appointment.status !== "Cancelled") appointment.status = "Completed";
  if (record.status === "In Progress" && ["Scheduled", "Confirmed", "Checked In", "Rescheduled"].includes(appointment.status)) appointment.status = "In Consultation";
}

const mockServiceRecordService: ServiceRecordService = {
  list: (filters) =>
    run(() => {
      const invoiceIndex = invoiceIdByServiceRecord();
      return getDb()
        .serviceRecords.filter((item) => scopeMatches(filters, item))
        .sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`))
        .map((item) => withServiceRecordRelations(item, invoiceIndex));
    }),
  get: (id) => run(() => withServiceRecordRelations(findOrThrow(getDb().serviceRecords, id, RESOURCE))),
  create: (input) =>
    run(() => {
      const patient = findPatient(input.patientId);
      assertProvider(input.providerId);
      const record = insertRecord<ServiceRecord>(getDb().serviceRecords, ID_PREFIX.serviceRecord, input);
      syncAppointment(record);
      logActivity("created", "Services", record.id, `Recorded ${record.serviceName} for ${patientName(patient)}`, record.branchId);
      return record;
    }),
  update: (id, input) =>
    run(() => {
      findPatient(input.patientId);
      assertProvider(input.providerId);
      const record = updateRecord(getDb().serviceRecords, id, input, RESOURCE);
      syncAppointment(record);
      logActivity("updated", "Services", id, `Updated ${record.serviceName}`, record.branchId);
      return record;
    }),
  updateStatus: (id, status) =>
    run(() => {
      const record = updateRecord(getDb().serviceRecords, id, { status }, RESOURCE);
      syncAppointment(record);
      logActivity("status_changed", "Services", id, `Marked ${record.serviceName} as ${status}`, record.branchId);
      return record;
    }),
  remove: (id) =>
    run(() => {
      const invoiceId = invoiceIdByServiceRecord().get(id);
      if (invoiceId) throw new ApiError(`This record is billed on invoice ${invoiceId}. Cancel the invoice before deleting it.`, 409);
      const removed = removeRecord(getDb().serviceRecords, id, RESOURCE);
      logActivity("deleted", "Services", id, `Deleted ${removed.serviceName}`, removed.branchId);
    }),
};

const httpServiceRecordService: ServiceRecordService = {
  list: (filters) => http.get<ServiceRecordWithRelations[]>("/service-records", filters),
  get: (id) => http.get<ServiceRecordWithRelations>(`/service-records/${id}`),
  create: (input) => http.post<ServiceRecord>("/service-records", input),
  update: (id, input) => http.put<ServiceRecord>(`/service-records/${id}`, input),
  updateStatus: (id, status) => http.patch<ServiceRecord>(`/service-records/${id}/status`, { status }),
  remove: (id) => http.delete(`/service-records/${id}`),
};

export const serviceRecordService = isMockApi ? mockServiceRecordService : httpServiceRecordService;

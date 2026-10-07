import { http } from "@/lib/api/client";
import { isMockApi } from "@/lib/api/config";
import { logActivity } from "@/lib/api/mock/audit";
import { findOrThrow, insertRecord, removeRecord, updateRecord } from "@/lib/api/mock/crud";
import { getDb } from "@/lib/api/mock/db";
import { assertProvider, findPatient, patientName, withConsultationRelations } from "@/lib/api/mock/relations";
import { run } from "@/lib/api/mock/run";
import { ID_PREFIX } from "@/lib/ids";
import type { Consultation, ConsultationWithRelations, CreateInput } from "@/types";

import { scopeMatches, type PatientScopedFilters } from "./types";

export type ConsultationInput = CreateInput<Consultation>;

export interface ConsultationService {
  list(filters?: PatientScopedFilters): Promise<ConsultationWithRelations[]>;
  get(id: string): Promise<ConsultationWithRelations>;
  create(input: ConsultationInput): Promise<Consultation>;
  update(id: string, input: ConsultationInput): Promise<Consultation>;
  remove(id: string): Promise<void>;
}

const RESOURCE = "Consultation";

const mockConsultationService: ConsultationService = {
  list: (filters) =>
    run(() =>
      getDb()
        .consultations.filter((item) => scopeMatches(filters, item))
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
        .map(withConsultationRelations),
    ),
  get: (id) => run(() => withConsultationRelations(findOrThrow(getDb().consultations, id, RESOURCE))),
  create: (input) =>
    run(() => {
      const patient = findPatient(input.patientId);
      assertProvider(input.providerId);
      const consultation = insertRecord<Consultation>(getDb().consultations, ID_PREFIX.consultation, input);
      // A consultation recorded against an active visit completes the consultation step.
      const appointment = getDb().appointments.find((item) => item.id === input.appointmentId);
      if (appointment && (appointment.status === "Checked In" || appointment.status === "Confirmed" || appointment.status === "Scheduled")) {
        appointment.status = "In Consultation";
      }
      logActivity("created", "Consultations", consultation.id, `Recorded consultation for ${patientName(patient)} — ${consultation.diagnosis}`, consultation.branchId);
      return consultation;
    }),
  update: (id, input) =>
    run(() => {
      findPatient(input.patientId);
      assertProvider(input.providerId);
      const consultation = updateRecord(getDb().consultations, id, input, RESOURCE);
      logActivity("updated", "Consultations", id, "Updated consultation notes", consultation.branchId);
      return consultation;
    }),
  remove: (id) =>
    run(() => {
      const db = getDb();
      const removed = removeRecord(db.consultations, id, RESOURCE);
      db.serviceRecords.forEach((item) => item.consultationId === id && (item.consultationId = null));
      logActivity("deleted", "Consultations", id, "Deleted consultation", removed.branchId);
    }),
};

const httpConsultationService: ConsultationService = {
  list: (filters) => http.get<ConsultationWithRelations[]>("/consultations", filters),
  get: (id) => http.get<ConsultationWithRelations>(`/consultations/${id}`),
  create: (input) => http.post<Consultation>("/consultations", input),
  update: (id, input) => http.put<Consultation>(`/consultations/${id}`, input),
  remove: (id) => http.delete(`/consultations/${id}`),
};

export const consultationService = isMockApi ? mockConsultationService : httpConsultationService;

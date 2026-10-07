import { http } from "@/lib/api/client";
import { isMockApi } from "@/lib/api/config";
import { ApiError } from "@/lib/api/errors";
import { logActivity } from "@/lib/api/mock/audit";
import { insertRecord, removeRecord, updateRecord } from "@/lib/api/mock/crud";
import { getDb } from "@/lib/api/mock/db";
import { run } from "@/lib/api/mock/run";
import { getSpecialty } from "@/lib/specialties";
import type { ClinicalService, CreateInput, SpecialtyId } from "@/types";

export type ClinicalServiceInput = CreateInput<ClinicalService>;

/** Clinical service catalog — treatments, procedures, therapies, sessions… */
export interface CatalogService {
  list(): Promise<ClinicalService[]>;
  create(input: ClinicalServiceInput): Promise<ClinicalService>;
  update(id: string, input: ClinicalServiceInput): Promise<ClinicalService>;
  remove(id: string): Promise<void>;
  /** Adds the specialty's default services that are not already in the catalog. */
  importDefaults(specialty: SpecialtyId): Promise<number>;
}

const mockCatalogService: CatalogService = {
  list: () => run(() => [...getDb().services].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))),
  create: (input) =>
    run(() => {
      const service = insertRecord<ClinicalService>(getDb().services, "SVC", input, 3);
      logActivity("created", "Clinic", service.id, `Added service ${service.name} to the catalog`);
      return service;
    }),
  update: (id, input) =>
    run(() => {
      const service = updateRecord(getDb().services, id, input, "Service");
      logActivity("updated", "Clinic", id, `Updated service ${service.name}`);
      return service;
    }),
  remove: (id) =>
    run(() => {
      const db = getDb();
      const used = db.serviceRecords.some((record) => record.serviceId === id) || db.appointments.some((a) => a.serviceId === id);
      if (used) throw new ApiError("This service has been used in records. Mark it inactive instead of deleting it.", 409);
      const removed = removeRecord(db.services, id, "Service");
      logActivity("deleted", "Clinic", id, `Removed service ${removed.name}`);
    }),
  importDefaults: (specialty) =>
    run(() => {
      const db = getDb();
      const existing = new Set(db.services.map((service) => service.name.toLowerCase()));
      const toAdd = getSpecialty(specialty).defaultServices.filter((service) => !existing.has(service.name.toLowerCase()));
      toAdd.forEach((service, index) =>
        insertRecord<ClinicalService>(db.services, "SVC", { ...service, specialty, code: `${specialty.slice(0, 2).toUpperCase()}${index + 1}`, active: true }, 3),
      );
      if (toAdd.length) logActivity("created", "Clinic", specialty, `Imported ${toAdd.length} default ${getSpecialty(specialty).name} services`);
      return toAdd.length;
    }),
};

const httpCatalogService: CatalogService = {
  list: () => http.get<ClinicalService[]>("/services"),
  create: (input) => http.post<ClinicalService>("/services", input),
  update: (id, input) => http.put<ClinicalService>(`/services/${id}`, input),
  remove: (id) => http.delete(`/services/${id}`),
  importDefaults: (specialty) => http.post<number>(`/services/import-defaults`, { specialty }),
};

export const catalogService = isMockApi ? mockCatalogService : httpCatalogService;

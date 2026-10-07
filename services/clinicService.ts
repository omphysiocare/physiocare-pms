import { http } from "@/lib/api/client";
import { isMockApi } from "@/lib/api/config";
import { ApiError } from "@/lib/api/errors";
import { logActivity } from "@/lib/api/mock/audit";
import { findOrThrow, insertRecord, updateRecord } from "@/lib/api/mock/crud";
import { commit, getDb, nowISO } from "@/lib/api/mock/db";
import { run } from "@/lib/api/mock/run";
import { ID_PREFIX } from "@/lib/ids";
import type { Branch, Clinic, ClinicProfileInput, CreateInput } from "@/types";

export type ClinicSection = "workingHours" | "holidays" | "appointmentSettings" | "billingSettings" | "branding" | "messaging";
export type BranchInput = CreateInput<Branch>;

export interface ClinicService {
  get(): Promise<Clinic>;
  updateProfile(input: ClinicProfileInput): Promise<Clinic>;
  updateSection<K extends ClinicSection>(section: K, value: Clinic[K]): Promise<Clinic>;
  listBranches(): Promise<Branch[]>;
  createBranch(input: Omit<BranchInput, "clinicId">): Promise<Branch>;
  updateBranch(id: string, input: Omit<BranchInput, "clinicId">): Promise<Branch>;
}

const SECTION_LABELS: Record<ClinicSection, string> = {
  workingHours: "working hours",
  holidays: "holidays",
  appointmentSettings: "appointment settings",
  billingSettings: "billing settings",
  branding: "invoice branding",
  messaging: "messaging settings",
};

const mockClinicService: ClinicService = {
  get: () => run(() => getDb().clinic),
  updateProfile: (input) =>
    run(() => {
      const db = getDb();
      if (!input.specialties.includes(input.primarySpecialty)) input.specialties = [input.primarySpecialty, ...input.specialties];
      db.clinic = { ...db.clinic, ...input, updatedAt: nowISO() };
      logActivity("updated", "Clinic", db.clinic.id, "Updated clinic profile");
      commit();
      return db.clinic;
    }),
  updateSection: (section, value) =>
    run(() => {
      const db = getDb();
      db.clinic = { ...db.clinic, [section]: value, updatedAt: nowISO() };
      logActivity("updated", "Clinic", db.clinic.id, `Updated ${SECTION_LABELS[section]}`);
      commit();
      return db.clinic;
    }),
  listBranches: () => run(() => getDb().branches),
  createBranch: (input) =>
    run(() => {
      const branch = insertRecord<Branch>(getDb().branches, ID_PREFIX.branch, input, 3);
      logActivity("created", "Clinic", branch.id, `Added branch ${branch.name}`);
      return branch;
    }),
  updateBranch: (id, input) =>
    run(() => {
      const db = getDb();
      const existing = findOrThrow(db.branches, id, "Branch");
      if (existing.isMain && !input.active) throw new ApiError("The main branch cannot be deactivated.", 409);
      const branch = updateRecord(db.branches, id, input, "Branch");
      logActivity("updated", "Clinic", id, `Updated branch ${branch.name}`);
      return branch;
    }),
};

const httpClinicService: ClinicService = {
  get: () => http.get<Clinic>("/clinic"),
  updateProfile: (input) => http.put<Clinic>("/clinic", input),
  updateSection: (section, value) => http.put<Clinic>(`/clinic/${section}`, value),
  listBranches: () => http.get<Branch[]>("/branches"),
  createBranch: (input) => http.post<Branch>("/branches", input),
  updateBranch: (id, input) => http.put<Branch>(`/branches/${id}`, input),
};

export const clinicService = isMockApi ? mockClinicService : httpClinicService;

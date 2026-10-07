import { http } from "@/lib/api/client";
import { isMockApi } from "@/lib/api/config";
import { ApiError } from "@/lib/api/errors";
import { actorName, logActivity } from "@/lib/api/mock/audit";
import { findOrThrow, inBranch, insertRecord, removeRecord, updateRecord } from "@/lib/api/mock/crud";
import { commit, getDb, nowISO } from "@/lib/api/mock/db";
import { assertProvider, lastVisitIndex, patientName, withPatientDetails } from "@/lib/api/mock/relations";
import { run } from "@/lib/api/mock/run";
import { getActorId } from "@/lib/api/session";
import { ID_PREFIX, nextId } from "@/lib/ids";
import type { CreateInput, Patient, PatientDocument, PatientListItem, PatientNote, PatientStatus } from "@/types";

import type { ListScope } from "./types";

export type PatientInput = CreateInput<Patient>;
export type DocumentInput = Omit<PatientDocument, "id" | "patientId" | "uploadedAt" | "uploadedBy">;

export interface PatientService {
  list(scope?: ListScope): Promise<PatientListItem[]>;
  get(id: string): Promise<PatientListItem>;
  create(input: PatientInput): Promise<Patient>;
  update(id: string, input: PatientInput): Promise<Patient>;
  updateStatus(id: string, status: PatientStatus): Promise<Patient>;
  remove(id: string): Promise<void>;
  listDocuments(patientId: string): Promise<PatientDocument[]>;
  uploadDocument(patientId: string, input: DocumentInput): Promise<PatientDocument>;
  deleteDocument(patientId: string, documentId: string): Promise<void>;
  listNotes(patientId: string): Promise<PatientNote[]>;
  addNote(patientId: string, text: string): Promise<PatientNote>;
  deleteNote(patientId: string, noteId: string): Promise<void>;
}

const RESOURCE = "Patient";
/** Mock storage keeps small files inline; larger ones keep metadata only. */
const INLINE_LIMIT = 600_000;

function digits(phone: string) {
  return phone.replace(/\D/g, "").slice(-10);
}

const mockPatientService: PatientService = {
  list: (scope) =>
    run(() => {
      const lastVisits = lastVisitIndex();
      return getDb()
        .patients.filter((patient) => inBranch(scope?.branchId, patient.branchId))
        .map((patient) => withPatientDetails(patient, lastVisits))
        .sort((a, b) => b.id.localeCompare(a.id));
    }),
  get: (id) => run(() => withPatientDetails(findOrThrow(getDb().patients, id, RESOURCE))),
  create: (input) =>
    run(() => {
      assertProvider(input.primaryProviderId);
      const db = getDb();
      const duplicate = db.patients.find((patient) => digits(patient.phone) === digits(input.phone));
      if (duplicate) throw new ApiError(`A patient with this mobile number already exists (${duplicate.id} · ${patientName(duplicate)}).`, 409);
      const patient = insertRecord<Patient>(db.patients, ID_PREFIX.patient, input);
      logActivity("created", "Patients", patient.id, `Registered patient ${patientName(patient)}`, patient.branchId);
      return patient;
    }),
  update: (id, input) =>
    run(() => {
      assertProvider(input.primaryProviderId);
      const patient = updateRecord(getDb().patients, id, input, RESOURCE);
      logActivity("updated", "Patients", id, `Updated details of ${patientName(patient)}`, patient.branchId);
      return patient;
    }),
  updateStatus: (id, status) =>
    run(() => {
      const patient = updateRecord(getDb().patients, id, { status }, RESOURCE);
      logActivity("status_changed", "Patients", id, `Marked ${patientName(patient)} as ${status}`, patient.branchId);
      return patient;
    }),
  remove: (id) =>
    run(() => {
      const db = getDb();
      const linked =
        db.appointments.filter((item) => item.patientId === id).length +
        db.consultations.filter((item) => item.patientId === id).length +
        db.serviceRecords.filter((item) => item.patientId === id).length +
        db.invoices.filter((item) => item.patientId === id).length;
      if (linked > 0) {
        throw new ApiError(`This patient has ${linked} linked clinical or billing records and cannot be deleted. Mark the patient as Inactive instead.`, 409);
      }
      const removed = removeRecord(db.patients, id, RESOURCE);
      db.patientDocuments = db.patientDocuments.filter((doc) => doc.patientId !== id);
      db.patientNotes = db.patientNotes.filter((note) => note.patientId !== id);
      logActivity("deleted", "Patients", id, `Deleted patient ${patientName(removed)}`, removed.branchId);
    }),
  listDocuments: (patientId) =>
    run(() => getDb().patientDocuments.filter((doc) => doc.patientId === patientId).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))),
  uploadDocument: (patientId, input) =>
    run(() => {
      const db = getDb();
      const patient = findOrThrow(db.patients, patientId, RESOURCE);
      const document: PatientDocument = {
        ...input,
        dataUrl: input.dataUrl && input.dataUrl.length <= INLINE_LIMIT ? input.dataUrl : null,
        id: nextId(ID_PREFIX.document, db.patientDocuments.map((doc) => doc.id)),
        patientId,
        uploadedAt: nowISO(),
        uploadedBy: actorName(),
      };
      db.patientDocuments.push(document);
      commit();
      logActivity("uploaded", "Patients", patientId, `Uploaded "${document.name}" for ${patientName(patient)}`, patient.branchId);
      return document;
    }, 500),
  deleteDocument: (patientId, documentId) =>
    run(() => {
      const db = getDb();
      const document = findOrThrow(db.patientDocuments, documentId, "Document");
      db.patientDocuments = db.patientDocuments.filter((doc) => doc.id !== documentId);
      commit();
      logActivity("deleted", "Patients", patientId, `Deleted document "${document.name}"`);
    }),
  listNotes: (patientId) =>
    run(() => getDb().patientNotes.filter((note) => note.patientId === patientId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
  addNote: (patientId, text) =>
    run(() => {
      const db = getDb();
      findOrThrow(db.patients, patientId, RESOURCE);
      const note: PatientNote = {
        id: nextId(ID_PREFIX.note, db.patientNotes.map((item) => item.id)),
        patientId,
        text: text.trim(),
        createdAt: nowISO(),
        authorId: getActorId(),
        authorName: actorName(),
      };
      db.patientNotes.push(note);
      commit();
      logActivity("created", "Patients", patientId, "Added a patient note");
      return note;
    }),
  deleteNote: (patientId, noteId) =>
    run(() => {
      const db = getDb();
      findOrThrow(db.patientNotes, noteId, "Note");
      db.patientNotes = db.patientNotes.filter((note) => note.id !== noteId);
      commit();
      logActivity("deleted", "Patients", patientId, "Deleted a patient note");
    }),
};

const httpPatientService: PatientService = {
  list: (scope) => http.get<PatientListItem[]>("/patients", scope),
  get: (id) => http.get<PatientListItem>(`/patients/${id}`),
  create: (input) => http.post<Patient>("/patients", input),
  update: (id, input) => http.put<Patient>(`/patients/${id}`, input),
  updateStatus: (id, status) => http.patch<Patient>(`/patients/${id}/status`, { status }),
  remove: (id) => http.delete(`/patients/${id}`),
  listDocuments: (patientId) => http.get<PatientDocument[]>(`/patients/${patientId}/documents`),
  uploadDocument: (patientId, input) => http.post<PatientDocument>(`/patients/${patientId}/documents`, input),
  deleteDocument: (patientId, documentId) => http.delete(`/patients/${patientId}/documents/${documentId}`),
  listNotes: (patientId) => http.get<PatientNote[]>(`/patients/${patientId}/notes`),
  addNote: (patientId, text) => http.post<PatientNote>(`/patients/${patientId}/notes`, { text }),
  deleteNote: (patientId, noteId) => http.delete(`/patients/${patientId}/notes/${noteId}`),
};

export const patientService = isMockApi ? mockPatientService : httpPatientService;

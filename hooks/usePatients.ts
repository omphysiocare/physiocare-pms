"use client";

import { useQuery } from "@tanstack/react-query";

import { useBranch } from "@/providers/BranchProvider";
import { patientService, type DocumentInput, type PatientInput } from "@/services/patientService";
import type { PatientStatus } from "@/types";

import { useAppMutation } from "./useMutationHelpers";

export function usePatients() {
  const { branchId } = useBranch();
  return useQuery({ queryKey: ["patients", "list", branchId], queryFn: () => patientService.list({ branchId }) });
}

/** All patients regardless of branch (for pickers). */
export function useAllPatients() {
  return useQuery({ queryKey: ["patients", "list", "all"], queryFn: () => patientService.list({ branchId: "all" }) });
}

export function usePatient(id: string) {
  return useQuery({ queryKey: ["patients", "detail", id], queryFn: () => patientService.get(id), enabled: !!id });
}

export function useCreatePatient() {
  return useAppMutation((input: PatientInput) => patientService.create(input));
}

export function useUpdatePatient(id: string) {
  return useAppMutation((input: PatientInput) => patientService.update(id, input));
}

export function useUpdatePatientStatus() {
  return useAppMutation(({ id, status }: { id: string; status: PatientStatus }) => patientService.updateStatus(id, status));
}

export function useDeletePatient() {
  return useAppMutation((id: string) => patientService.remove(id));
}

export function usePatientDocuments(patientId: string) {
  return useQuery({ queryKey: ["patients", "documents", patientId], queryFn: () => patientService.listDocuments(patientId), enabled: !!patientId });
}

export function useUploadDocument(patientId: string) {
  return useAppMutation((input: DocumentInput) => patientService.uploadDocument(patientId, input));
}

export function useDeleteDocument(patientId: string) {
  return useAppMutation((documentId: string) => patientService.deleteDocument(patientId, documentId));
}

export function usePatientNotes(patientId: string) {
  return useQuery({ queryKey: ["patients", "notes", patientId], queryFn: () => patientService.listNotes(patientId), enabled: !!patientId });
}

export function useAddNote(patientId: string) {
  return useAppMutation((text: string) => patientService.addNote(patientId, text));
}

export function useDeleteNote(patientId: string) {
  return useAppMutation((noteId: string) => patientService.deleteNote(patientId, noteId));
}

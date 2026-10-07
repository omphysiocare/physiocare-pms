"use client";

import { useQuery } from "@tanstack/react-query";

import { useBranch } from "@/providers/BranchProvider";
import { consultationService, type ConsultationInput } from "@/services/consultationService";

import { useAppMutation } from "./useMutationHelpers";

export function useConsultations(patientId?: string) {
  const { branchId } = useBranch();
  const filters = patientId ? { patientId } : { branchId };
  return useQuery({ queryKey: ["consultations", "list", filters], queryFn: () => consultationService.list(filters) });
}

export function useConsultation(id: string) {
  return useQuery({ queryKey: ["consultations", "detail", id], queryFn: () => consultationService.get(id), enabled: !!id });
}

export function useCreateConsultation() {
  return useAppMutation((input: ConsultationInput) => consultationService.create(input));
}

export function useUpdateConsultation(id: string) {
  return useAppMutation((input: ConsultationInput) => consultationService.update(id, input));
}

export function useDeleteConsultation() {
  return useAppMutation((id: string) => consultationService.remove(id));
}

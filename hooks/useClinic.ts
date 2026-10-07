"use client";

import { useQuery } from "@tanstack/react-query";

import { getSpecialty } from "@/lib/specialties";
import { catalogService, type ClinicalServiceInput } from "@/services/catalogService";
import { clinicService, type BranchInput, type ClinicSection } from "@/services/clinicService";
import type { Clinic, ClinicProfileInput, SpecialtyId, Terminology } from "@/types";

import { useAppMutation } from "./useMutationHelpers";

export function useClinic() {
  return useQuery({ queryKey: ["clinic"], queryFn: () => clinicService.get(), staleTime: 60_000 });
}

export function useUpdateClinicProfile() {
  return useAppMutation((input: ClinicProfileInput) => clinicService.updateProfile(input));
}

export function useUpdateClinicSection<K extends ClinicSection>(section: K) {
  return useAppMutation((value: Clinic[K]) => clinicService.updateSection(section, value));
}

export function useBranches() {
  return useQuery({ queryKey: ["branches"], queryFn: () => clinicService.listBranches(), staleTime: 60_000 });
}

export function useSaveBranch() {
  return useAppMutation(({ id, input }: { id?: string; input: Omit<BranchInput, "clinicId"> }) => (id ? clinicService.updateBranch(id, input) : clinicService.createBranch(input)));
}

export function useCatalog() {
  return useQuery({ queryKey: ["catalog"], queryFn: () => catalogService.list(), staleTime: 60_000 });
}

export function useSaveCatalogService() {
  return useAppMutation(({ id, input }: { id?: string; input: ClinicalServiceInput }) => (id ? catalogService.update(id, input) : catalogService.create(input)));
}

export function useDeleteCatalogService() {
  return useAppMutation((id: string) => catalogService.remove(id));
}

export function useImportDefaultServices() {
  return useAppMutation((specialty: SpecialtyId) => catalogService.importDefaults(specialty));
}

/** Terminology of the clinic's primary specialty (e.g. "Treatments" vs "Procedures"). */
export function useTerminology(): Terminology {
  const { data } = useClinic();
  return getSpecialty(data?.primarySpecialty ?? "physiotherapy").terminology;
}

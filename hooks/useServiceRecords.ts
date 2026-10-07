"use client";

import { useQuery } from "@tanstack/react-query";

import { useBranch } from "@/providers/BranchProvider";
import { serviceRecordService, type ServiceRecordInput } from "@/services/serviceRecordService";
import type { ServiceRecordStatus } from "@/types";

import { useAppMutation } from "./useMutationHelpers";

export function useServiceRecords(patientId?: string) {
  const { branchId } = useBranch();
  const filters = patientId ? { patientId } : { branchId };
  return useQuery({ queryKey: ["serviceRecords", "list", filters], queryFn: () => serviceRecordService.list(filters) });
}

export function useServiceRecord(id: string) {
  return useQuery({ queryKey: ["serviceRecords", "detail", id], queryFn: () => serviceRecordService.get(id), enabled: !!id });
}

export function useCreateServiceRecord() {
  return useAppMutation((input: ServiceRecordInput) => serviceRecordService.create(input));
}

export function useUpdateServiceRecord(id: string) {
  return useAppMutation((input: ServiceRecordInput) => serviceRecordService.update(id, input));
}

export function useUpdateServiceRecordStatus() {
  return useAppMutation(({ id, status }: { id: string; status: ServiceRecordStatus }) => serviceRecordService.updateStatus(id, status));
}

export function useDeleteServiceRecord() {
  return useAppMutation((id: string) => serviceRecordService.remove(id));
}

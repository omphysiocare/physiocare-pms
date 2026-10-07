"use client";

import { useQuery } from "@tanstack/react-query";

import { useBranch } from "@/providers/BranchProvider";
import { appointmentService, type AppointmentInput, type RescheduleInput } from "@/services/appointmentService";
import type { AppointmentStatus } from "@/types";

import { useAppMutation } from "./useMutationHelpers";

/** Branch-scoped appointments, or all appointments of one patient. */
export function useAppointments(patientId?: string) {
  const { branchId } = useBranch();
  const filters = patientId ? { patientId } : { branchId };
  return useQuery({ queryKey: ["appointments", "list", filters], queryFn: () => appointmentService.list(filters) });
}

export function useAppointment(id: string) {
  return useQuery({ queryKey: ["appointments", "detail", id], queryFn: () => appointmentService.get(id), enabled: !!id });
}

export function useCreateAppointment() {
  return useAppMutation((input: AppointmentInput) => appointmentService.create(input));
}

export function useUpdateAppointment(id: string) {
  return useAppMutation((input: AppointmentInput) => appointmentService.update(id, input));
}

export function useUpdateAppointmentStatus() {
  return useAppMutation(({ id, status, reason }: { id: string; status: AppointmentStatus; reason?: string }) => appointmentService.updateStatus(id, status, reason));
}

export function useRescheduleAppointment() {
  return useAppMutation(({ id, input }: { id: string; input: RescheduleInput }) => appointmentService.reschedule(id, input));
}

export function useDeleteAppointment() {
  return useAppMutation((id: string) => appointmentService.remove(id));
}

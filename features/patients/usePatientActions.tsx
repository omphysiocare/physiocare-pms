"use client";

import { useRouter } from "next/navigation";

import { useConfirm } from "@/components/common";
import { useDeletePatient, useUpdatePatientStatus } from "@/hooks/usePatients";
import { useNotify } from "@/providers/NotificationProvider";
import type { PatientListItem, PatientStatus } from "@/types";

/** Shared delete/status actions for the patient list and detail pages. */
export function usePatientActions({ redirectAfterDelete }: { redirectAfterDelete?: string } = {}) {
  const router = useRouter();
  const notify = useNotify();
  const { confirm, dialog } = useConfirm();
  const deletePatient = useDeletePatient();
  const updateStatus = useUpdatePatientStatus();

  const remove = async (patient: Pick<PatientListItem, "id" | "name">) => {
    const ok = await confirm({
      title: "Delete patient?",
      description: `${patient.name} (${patient.id}) will be permanently removed. Patients with clinical or billing history cannot be deleted.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deletePatient.mutateAsync(patient.id);
      notify.success(`Patient ${patient.id} deleted`);
      if (redirectAfterDelete) router.push(redirectAfterDelete);
    } catch (error) {
      notify.error(error);
    }
  };

  const setStatus = async (patient: Pick<PatientListItem, "id" | "name">, status: PatientStatus) => {
    try {
      await updateStatus.mutateAsync({ id: patient.id, status });
      notify.success(`${patient.name} marked as ${status}`);
    } catch (error) {
      notify.error(error);
    }
  };

  return { remove, setStatus, dialog };
}

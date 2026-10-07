"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { LoadingState, PageHeader, QueryBoundary } from "@/components/common";
import { useBranches, useClinic } from "@/hooks/useClinic";
import { useCreatePatient, usePatient, useUpdatePatient } from "@/hooks/usePatients";
import { useBranch } from "@/providers/BranchProvider";
import { useNotify } from "@/providers/NotificationProvider";

import PatientForm from "./PatientForm";
import { emptyPatientValues, formValuesToPatientInput, patientToFormValues, type PatientFormValues } from "./schema";

export function PatientCreateView() {
  const router = useRouter();
  const notify = useNotify();
  const createPatient = useCreatePatient();
  const clinic = useClinic();
  const branches = useBranches();
  const { branchId } = useBranch();

  const defaults = useMemo(
    () =>
      emptyPatientValues({
        providerId: clinic.data?.appointmentSettings.defaultProviderId,
        branchId: branchId !== "all" ? branchId : branches.data?.find((b) => b.isMain)?.id,
        city: clinic.data?.city,
        state: clinic.data?.state,
        country: clinic.data?.country,
      }),
    [clinic.data, branches.data, branchId],
  );

  const handleSubmit = async (values: PatientFormValues) => {
    try {
      const patient = await createPatient.mutateAsync(formValuesToPatientInput(values));
      notify.success(`Patient ${patient.firstName} ${patient.lastName} registered (${patient.id})`);
      router.push(`/patients/${patient.id}`);
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <>
      <PageHeader title="Register Patient" description="Create a new patient record." backHref="/patients" backLabel="Patients" />
      {clinic.isPending || branches.isPending ? (
        <LoadingState variant="form" />
      ) : (
        <PatientForm defaultValues={defaults} submitLabel="Register Patient" onSubmit={handleSubmit} onCancel={() => router.push("/patients")} />
      )}
    </>
  );
}

export function PatientEditView({ id }: { id: string }) {
  const router = useRouter();
  const notify = useNotify();
  const query = usePatient(id);
  const updatePatient = useUpdatePatient(id);

  const handleSubmit = async (values: PatientFormValues) => {
    try {
      await updatePatient.mutateAsync(formValuesToPatientInput(values));
      notify.success("Patient details updated");
      router.push(`/patients/${id}`);
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <>
      <PageHeader title="Edit Patient" description={query.data ? `${query.data.name} · ${id}` : id} backHref={`/patients/${id}`} backLabel="Patient profile" />
      <QueryBoundary query={query} resource="Patient" backHref="/patients" loadingVariant="form">
        {(patient) => <PatientForm defaultValues={patientToFormValues(patient)} submitLabel="Save Changes" onSubmit={handleSubmit} onCancel={() => router.push(`/patients/${id}`)} />}
      </QueryBoundary>
    </>
  );
}

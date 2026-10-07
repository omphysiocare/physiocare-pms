"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { LoadingState, PageHeader, QueryBoundary } from "@/components/common";
import { useAppointment } from "@/hooks/useAppointments";
import { useClinic, useTerminology } from "@/hooks/useClinic";
import { useConsultation, useCreateConsultation, useUpdateConsultation } from "@/hooks/useConsultations";
import { useMembers } from "@/hooks/useMembers";
import { usePatient } from "@/hooks/usePatients";
import { getSpecialty } from "@/lib/specialties";
import { useNotify } from "@/providers/NotificationProvider";

import ConsultationForm from "./ConsultationForm";
import { consultationToFormValues, emptyConsultationValues, formValuesToConsultationInput, type ConsultationFormValues } from "./schema";

export function ConsultationCreateView({ patientId, appointmentId }: { patientId?: string; appointmentId?: string }) {
  const router = useRouter();
  const notify = useNotify();
  const terms = useTerminology();
  const create = useCreateConsultation();
  const clinic = useClinic();
  const members = useMembers();
  const appointment = useAppointment(appointmentId ?? "");
  const patient = usePatient(patientId ?? appointment.data?.patientId ?? "");
  const loading = clinic.isPending || members.isPending || (!!appointmentId && appointment.isPending) || (!!(patientId ?? appointment.data?.patientId) && patient.isPending);

  const defaults = useMemo(() => {
    const providerId = appointment.data?.providerId ?? patient.data?.primaryProviderId ?? "";
    const provider = members.data?.find((m) => m.id === providerId);
    const specialty = provider?.specialty || clinic.data?.primarySpecialty;
    const p = patient.data;
    return emptyConsultationValues({
      patientId: p?.id ?? "",
      providerId,
      branchId: appointment.data?.branchId ?? p?.branchId ?? "",
      appointmentId: appointment.data?.id ?? "",
      date: appointment.data?.date,
      visitType: appointment.data && /follow|review/i.test(appointment.data.type) ? "Follow-up" : "New",
      chiefComplaint: appointment.data?.reason ?? "",
      medicalHistory: p?.medical.medicalHistory,
      surgicalHistory: p?.medical.surgicalHistory,
      familyHistory: p?.medical.familyHistory,
      allergies: p?.medical.allergies,
      currentMedications: p?.medical.currentMedications,
      diagnosis: p?.medical.primaryCondition ?? "",
      templateId: specialty ? getSpecialty(specialty).consultationTemplate.id : "",
    });
  }, [appointment.data, patient.data, members.data, clinic.data]);
  const backHref = appointmentId ? `/appointments/${appointmentId}` : patientId ? `/patients/${patientId}` : "/consultations";

  const handleSubmit = async (values: ConsultationFormValues) => {
    try {
      const consultation = await create.mutateAsync(formValuesToConsultationInput(values));
      notify.success(`${terms.consultation} ${consultation.id} saved`);
      router.push(`/consultations/${consultation.id}`);
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <>
      <PageHeader title={`New ${terms.consultation}`} description="Record history, vitals, findings, diagnosis and plan." backHref={backHref} />
      {loading ? <LoadingState variant="form" /> : <ConsultationForm defaultValues={defaults} submitLabel={`Save ${terms.consultation}`} onSubmit={handleSubmit} onCancel={() => router.push(backHref)} />}
    </>
  );
}

export function ConsultationEditView({ id }: { id: string }) {
  const router = useRouter();
  const notify = useNotify();
  const terms = useTerminology();
  const query = useConsultation(id);
  const update = useUpdateConsultation(id);

  const handleSubmit = async (values: ConsultationFormValues) => {
    try {
      await update.mutateAsync(formValuesToConsultationInput(values));
      notify.success(`${terms.consultation} updated`);
      router.push(`/consultations/${id}`);
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <>
      <PageHeader title={`Edit ${terms.consultation}`} description={query.data ? `${id} · ${query.data.patient.name}` : id} backHref={`/consultations/${id}`} backLabel={terms.consultation} />
      <QueryBoundary query={query} resource={terms.consultation} backHref="/consultations" loadingVariant="form">
        {(consultation) => <ConsultationForm defaultValues={consultationToFormValues(consultation)} submitLabel="Save Changes" onSubmit={handleSubmit} onCancel={() => router.push(`/consultations/${id}`)} />}
      </QueryBoundary>
    </>
  );
}

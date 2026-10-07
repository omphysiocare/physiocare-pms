"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { LoadingState, PageHeader, QueryBoundary } from "@/components/common";
import { useAppointment, useCreateAppointment, useUpdateAppointment } from "@/hooks/useAppointments";
import { useBranches, useClinic } from "@/hooks/useClinic";
import { usePatient } from "@/hooks/usePatients";
import { useBranch } from "@/providers/BranchProvider";
import { useNotify } from "@/providers/NotificationProvider";

import AppointmentForm from "./AppointmentForm";
import { appointmentToFormValues, emptyAppointmentValues, formValuesToAppointmentInput, nextSlot, type AppointmentFormValues } from "./schema";

interface CreateProps {
  patientId?: string;
  date?: string;
  time?: string;
  providerId?: string;
}

export function AppointmentCreateView({ patientId, date, time, providerId }: CreateProps) {
  const router = useRouter();
  const notify = useNotify();
  const createAppointment = useCreateAppointment();
  const clinic = useClinic();
  const branches = useBranches();
  const { branchId } = useBranch();
  const patient = usePatient(patientId ?? "");
  const loading = clinic.isPending || branches.isPending || (!!patientId && patient.isPending);

  const defaults = useMemo(() => {
    const settings = clinic.data?.appointmentSettings;
    const today = clinic.data?.workingHours.find((d) => d.open);
    return emptyAppointmentValues({
      patientId: patient.data?.id,
      providerId: providerId ?? patient.data?.primaryProviderId ?? settings?.defaultProviderId,
      branchId: patient.data?.branchId ?? (branchId !== "all" ? branchId : branches.data?.find((b) => b.isMain)?.id),
      date,
      startTime: time ?? nextSlot(today?.start, today?.end),
      duration: settings?.slotDurationMinutes,
      type: patient.data ? "Follow-up" : "New Consultation",
    });
  }, [patient.data, clinic.data, branches.data, branchId, date, time, providerId]);
  const backHref = patientId ? `/patients/${patientId}` : "/appointments";

  const handleSubmit = async (values: AppointmentFormValues) => {
    try {
      const appointment = await createAppointment.mutateAsync(formValuesToAppointmentInput(values));
      notify.success(`Appointment ${appointment.id} booked`);
      router.push(`/appointments/${appointment.id}`);
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <>
      <PageHeader title="Book Appointment" description="Schedule a visit for a patient." backHref={backHref} />
      {loading ? <LoadingState variant="form" /> : <AppointmentForm defaultValues={defaults} submitLabel="Book Appointment" onSubmit={handleSubmit} onCancel={() => router.push(backHref)} />}
    </>
  );
}

export function AppointmentEditView({ id }: { id: string }) {
  const router = useRouter();
  const notify = useNotify();
  const query = useAppointment(id);
  const updateAppointment = useUpdateAppointment(id);

  const handleSubmit = async (values: AppointmentFormValues) => {
    try {
      await updateAppointment.mutateAsync(formValuesToAppointmentInput(values));
      notify.success("Appointment updated");
      router.push(`/appointments/${id}`);
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <>
      <PageHeader title="Edit Appointment" description={query.data ? `${id} · ${query.data.patient.name}` : id} backHref={`/appointments/${id}`} backLabel="Appointment" />
      <QueryBoundary query={query} resource="Appointment" backHref="/appointments" loadingVariant="form">
        {(appointment) => <AppointmentForm defaultValues={appointmentToFormValues(appointment)} submitLabel="Save Changes" onSubmit={handleSubmit} onCancel={() => router.push(`/appointments/${id}`)} />}
      </QueryBoundary>
    </>
  );
}

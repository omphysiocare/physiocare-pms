"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { LoadingState, PageHeader, QueryBoundary } from "@/components/common";
import { useAppointment } from "@/hooks/useAppointments";
import { useCatalog, useTerminology } from "@/hooks/useClinic";
import { useConsultations } from "@/hooks/useConsultations";
import { usePatient } from "@/hooks/usePatients";
import { useCreateServiceRecord, useServiceRecord, useServiceRecords, useUpdateServiceRecord } from "@/hooks/useServiceRecords";
import { useNotify } from "@/providers/NotificationProvider";

import { emptyServiceRecordValues, formValuesToServiceRecordInput, serviceRecordToFormValues, type ServiceRecordFormValues } from "./schema";
import ServiceRecordForm from "./ServiceRecordForm";
import { suggestNextSession } from "./sessionPlan";

export function ServiceRecordCreateView({ patientId, appointmentId, consultationId }: { patientId?: string; appointmentId?: string; consultationId?: string }) {
  const router = useRouter();
  const notify = useNotify();
  const terms = useTerminology();
  const create = useCreateServiceRecord();
  const catalog = useCatalog();
  const appointment = useAppointment(appointmentId ?? "");
  const resolvedPatient = patientId ?? appointment.data?.patientId ?? "";
  const patient = usePatient(resolvedPatient);
  const consultations = useConsultations(resolvedPatient || "__none__");
  const records = useServiceRecords(resolvedPatient || "__none__");
  const loading = catalog.isPending || (!!appointmentId && appointment.isPending) || (!!resolvedPatient && (patient.isPending || consultations.isPending || records.isPending));

  const defaults = useMemo(() => {
    const suggestion = resolvedPatient && consultations.data && records.data ? suggestNextSession(consultations.data, records.data, consultationId) : null;
    const service = catalog.data?.find((s) => s.id === (appointment.data?.serviceId ?? suggestion?.serviceId));
    return emptyServiceRecordValues({
      patientId: patient.data?.id,
      providerId: appointment.data?.providerId ?? patient.data?.primaryProviderId,
      branchId: appointment.data?.branchId ?? patient.data?.branchId,
      appointmentId: appointment.data?.id,
      consultationId: suggestion?.consultationId,
      sessionNumber: suggestion?.sessionNumber,
      totalSessions: suggestion?.totalSessions,
      area: suggestion?.area,
      serviceId: service?.id,
      serviceName: service?.name,
      amount: service?.price,
      durationMinutes: service?.durationMinutes,
      date: appointment.data?.date,
      startTime: appointment.data?.startTime,
      status: appointment.data?.status === "Completed" ? "Completed" : appointment.data?.status === "In Consultation" ? "In Progress" : undefined,
    });
  }, [resolvedPatient, consultationId, patient.data, appointment.data, consultations.data, records.data, catalog.data]);
  const backHref = appointmentId ? `/appointments/${appointmentId}` : consultationId ? `/consultations/${consultationId}` : patientId ? `/patients/${patientId}` : "/treatments";

  const handleSubmit = async (values: ServiceRecordFormValues) => {
    try {
      const record = await create.mutateAsync(formValuesToServiceRecordInput(values));
      notify.success(`${terms.serviceRecord} ${record.id} recorded`);
      router.push(`/treatments/${record.id}`);
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <>
      <PageHeader title={`Record ${terms.serviceRecord}`} description={`Log a ${terms.serviceRecord.toLowerCase()} delivered to a patient.`} backHref={backHref} />
      {loading ? <LoadingState variant="form" /> : <ServiceRecordForm defaultValues={defaults} submitLabel={`Save ${terms.serviceRecord}`} onSubmit={handleSubmit} onCancel={() => router.push(backHref)} />}
    </>
  );
}

export function ServiceRecordEditView({ id }: { id: string }) {
  const router = useRouter();
  const notify = useNotify();
  const terms = useTerminology();
  const query = useServiceRecord(id);
  const update = useUpdateServiceRecord(id);
  const handleSubmit = async (values: ServiceRecordFormValues) => {
    try {
      await update.mutateAsync(formValuesToServiceRecordInput(values));
      notify.success(`${terms.serviceRecord} updated`);
      router.push(`/treatments/${id}`);
    } catch (error) {
      notify.error(error);
    }
  };
  return (
    <>
      <PageHeader title={`Edit ${terms.serviceRecord}`} description={query.data ? `${id} · ${query.data.patient.name}` : id} backHref={`/treatments/${id}`} backLabel={terms.serviceRecord} />
      <QueryBoundary query={query} resource={terms.serviceRecord} backHref="/treatments" loadingVariant="form">
        {(record) => <ServiceRecordForm defaultValues={serviceRecordToFormValues(record)} submitLabel="Save Changes" onSubmit={handleSubmit} onCancel={() => router.push(`/treatments/${id}`)} />}
      </QueryBoundary>
    </>
  );
}

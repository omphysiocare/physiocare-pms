"use client";

import { Alert } from "@mui/material";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { LoadingState, PageHeader, QueryBoundary } from "@/components/common";
import { useAppointment } from "@/hooks/useAppointments";
import { useCreateInvoice, useInvoice, useUpdateInvoice } from "@/hooks/useBilling";
import { useCatalog, useClinic } from "@/hooks/useClinic";
import { useServiceRecord, useServiceRecords } from "@/hooks/useServiceRecords";
import { useNotify } from "@/providers/NotificationProvider";
import type { AppointmentWithRelations, ClinicalService, ServiceRecordWithRelations } from "@/types";

import InvoiceForm from "./InvoiceForm";
import { emptyInvoiceValues, formValuesToCreateInvoiceInput, formValuesToInvoiceInput, invoiceToFormValues, newItem, type InvoiceFormValues, type InvoiceItemFormValues } from "./schema";

function recordItem(record: ServiceRecordWithRelations, catalog: ClinicalService[]): InvoiceItemFormValues {
  return newItem({ description: `${record.serviceName} — Session ${record.sessionNumber} (${dayjs(record.date).format("DD MMM")})`, serviceId: record.serviceId, serviceRecordId: record.id, unitPrice: record.amount, taxRate: catalog.find((s) => s.id === record.serviceId)?.taxRate ?? 0 });
}

/** Starting line items from the record the user came from. */
function initialItems(appointment: AppointmentWithRelations | undefined, record: ServiceRecordWithRelations | undefined, patientRecords: ServiceRecordWithRelations[], catalog: ClinicalService[]): InvoiceItemFormValues[] {
  if (record && record.status === "Completed" && !record.invoiceId) return [recordItem(record, catalog)];
  if (!appointment) return [];
  const linked = patientRecords.filter((item) => item.appointmentId === appointment.id && item.status === "Completed" && !item.invoiceId);
  if (linked.length) return linked.map((item) => recordItem(item, catalog));
  const service = catalog.find((s) => s.id === appointment.serviceId);
  return service ? [newItem({ description: service.name, serviceId: service.id, unitPrice: service.price, taxRate: service.taxRate })] : [];
}

export function InvoiceCreateView({ patientId, appointmentId, serviceRecordId }: { patientId?: string; appointmentId?: string; serviceRecordId?: string }) {
  const router = useRouter();
  const notify = useNotify();
  const create = useCreateInvoice();
  const clinic = useClinic();
  const catalog = useCatalog();
  const appointment = useAppointment(appointmentId ?? "");
  const record = useServiceRecord(serviceRecordId ?? "");
  const resolvedPatient = patientId ?? record.data?.patientId ?? appointment.data?.patientId ?? "";
  const patientRecords = useServiceRecords(resolvedPatient || "__none__");
  const loading = clinic.isPending || catalog.isPending || (!!appointmentId && appointment.isPending) || (!!serviceRecordId && record.isPending) || (!!resolvedPatient && patientRecords.isPending);

  const defaults = useMemo<InvoiceFormValues>(
    () =>
      emptyInvoiceValues({
        patientId: resolvedPatient,
        providerId: record.data?.providerId ?? appointment.data?.providerId,
        branchId: record.data?.branchId ?? appointment.data?.branchId,
        appointmentId: appointment.data?.id ?? record.data?.appointmentId ?? "",
        paymentTermsDays: clinic.data?.billingSettings.paymentTermsDays,
        items: initialItems(appointment.data, record.data, patientRecords.data ?? [], catalog.data ?? []),
      }),
    [resolvedPatient, appointment.data, record.data, patientRecords.data, catalog.data, clinic.data],
  );
  const backHref = serviceRecordId ? `/treatments/${serviceRecordId}` : appointmentId ? `/appointments/${appointmentId}` : patientId ? `/patients/${patientId}` : "/billing";

  const handleSubmit = async (values: InvoiceFormValues) => {
    try {
      const invoice = await create.mutateAsync(formValuesToCreateInvoiceInput(values));
      notify.success(`Invoice ${invoice.id} created`);
      router.push(`/billing/${invoice.id}`);
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <>
      <PageHeader title="Create Invoice" description="Bill a patient for consultations and clinical services." backHref={backHref} />
      {loading ? <LoadingState variant="form" /> : <InvoiceForm defaultValues={defaults} submitLabel="Create Invoice" onSubmit={handleSubmit} onCancel={() => router.push(backHref)} />}
    </>
  );
}

export function InvoiceEditView({ id }: { id: string }) {
  const router = useRouter();
  const notify = useNotify();
  const query = useInvoice(id);
  const update = useUpdateInvoice(id);
  const handleSubmit = async (values: InvoiceFormValues) => {
    try {
      await update.mutateAsync(formValuesToInvoiceInput(values));
      notify.success("Invoice updated");
      router.push(`/billing/${id}`);
    } catch (error) {
      notify.error(error);
    }
  };
  return (
    <>
      <PageHeader title="Edit Invoice" description={query.data ? `${id} · ${query.data.patient.name}` : id} backHref={`/billing/${id}`} backLabel="Invoice" />
      <QueryBoundary query={query} resource="Invoice" backHref="/billing" loadingVariant="form">
        {(invoice) =>
          invoice.status === "Cancelled" || invoice.status === "Refunded" ? (
            <Alert severity="warning">{invoice.status} invoices cannot be edited.</Alert>
          ) : (
            <InvoiceForm invoiceId={invoice.id} alreadyPaid={invoice.paid} defaultValues={invoiceToFormValues(invoice)} submitLabel="Save Changes" onSubmit={handleSubmit} onCancel={() => router.push(`/billing/${id}`)} />
          )
        }
      </QueryBoundary>
    </>
  );
}

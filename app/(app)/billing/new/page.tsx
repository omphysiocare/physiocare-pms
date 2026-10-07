import type { Metadata } from "next";

import { InvoiceCreateView } from "@/features/billing/InvoiceFormViews";
import { firstParam } from "@/lib/params";

export const metadata: Metadata = { title: "Create Invoice" };

export default async function NewInvoicePage(props: PageProps<"/billing/new">) {
  const params = await props.searchParams;
  const patientId = firstParam(params.patientId);
  const appointmentId = firstParam(params.appointmentId);
  const serviceRecordId = firstParam(params.serviceRecordId);
  return <InvoiceCreateView key={`${patientId}-${appointmentId}-${serviceRecordId}`} patientId={patientId} appointmentId={appointmentId} serviceRecordId={serviceRecordId} />;
}

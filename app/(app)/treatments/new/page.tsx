import type { Metadata } from "next";

import { ServiceRecordCreateView } from "@/features/services/ServiceRecordFormViews";
import { firstParam } from "@/lib/params";

export const metadata: Metadata = { title: "Record Service" };

export default async function NewServiceRecordPage(props: PageProps<"/treatments/new">) {
  const params = await props.searchParams;
  const patientId = firstParam(params.patientId);
  const appointmentId = firstParam(params.appointmentId);
  const consultationId = firstParam(params.consultationId);
  return <ServiceRecordCreateView key={`${patientId}-${appointmentId}-${consultationId}`} patientId={patientId} appointmentId={appointmentId} consultationId={consultationId} />;
}

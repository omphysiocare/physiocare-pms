import type { Metadata } from "next";

import { ConsultationCreateView } from "@/features/consultations/ConsultationFormViews";
import { firstParam } from "@/lib/params";

export const metadata: Metadata = { title: "New Consultation" };

export default async function NewConsultationPage(props: PageProps<"/consultations/new">) {
  const searchParams = await props.searchParams;
  const patientId = firstParam(searchParams.patientId);
  const appointmentId = firstParam(searchParams.appointmentId);
  return <ConsultationCreateView key={`${patientId}-${appointmentId}`} patientId={patientId} appointmentId={appointmentId} />;
}

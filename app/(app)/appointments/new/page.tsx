import type { Metadata } from "next";

import { AppointmentCreateView } from "@/features/appointments/AppointmentFormViews";
import { firstParam } from "@/lib/params";

export const metadata: Metadata = { title: "Book Appointment" };

export default async function NewAppointmentPage(props: PageProps<"/appointments/new">) {
  const params = await props.searchParams;
  const patientId = firstParam(params.patientId);
  const date = firstParam(params.date);
  const time = firstParam(params.time);
  const providerId = firstParam(params.providerId);
  return <AppointmentCreateView key={`${patientId}-${date}-${time}-${providerId}`} patientId={patientId} date={date} time={time} providerId={providerId} />;
}

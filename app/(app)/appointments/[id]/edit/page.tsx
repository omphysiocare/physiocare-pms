import type { Metadata } from "next";

import { AppointmentEditView } from "@/features/appointments/AppointmentFormViews";

export const metadata: Metadata = { title: "Edit Appointment" };

export default async function EditAppointmentPage(props: PageProps<"/appointments/[id]/edit">) {
  const { id } = await props.params;
  return <AppointmentEditView id={decodeURIComponent(id)} />;
}

import type { Metadata } from "next";

import AppointmentDetailView from "@/features/appointments/AppointmentDetailView";

export async function generateMetadata(props: PageProps<"/appointments/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: `Appointment ${decodeURIComponent(id)}` };
}

export default async function AppointmentDetailPage(props: PageProps<"/appointments/[id]">) {
  const { id } = await props.params;
  return <AppointmentDetailView id={decodeURIComponent(id)} />;
}

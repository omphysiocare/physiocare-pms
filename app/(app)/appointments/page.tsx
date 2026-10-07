import type { Metadata } from "next";

import AppointmentListView, { type CalendarMode } from "@/features/appointments/AppointmentListView";
import { firstParam } from "@/lib/params";

export const metadata: Metadata = { title: "Appointments" };

const VIEWS: CalendarMode[] = ["list", "day", "week", "month"];

export default async function AppointmentsPage(props: PageProps<"/appointments">) {
  const view = firstParam((await props.searchParams).view) as CalendarMode | undefined;
  return <AppointmentListView initialView={view && VIEWS.includes(view) ? view : "list"} />;
}

import type { Metadata } from "next";

import ClinicView from "@/features/clinic/ClinicView";
import { CLINIC_TABS, type ClinicTab } from "@/features/clinic/tabs";
import { firstParam } from "@/lib/params";

export const metadata: Metadata = { title: "Clinic" };

export default async function ClinicPage(props: PageProps<"/clinic">) {
  const tab = firstParam((await props.searchParams).tab) as ClinicTab | undefined;
  const initialTab = tab && CLINIC_TABS.includes(tab) ? tab : undefined;
  return <ClinicView key={initialTab ?? "profile"} initialTab={initialTab} />;
}

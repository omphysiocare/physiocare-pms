import type { Metadata } from "next";

import PatientDetailView from "@/features/patients/PatientDetailView";

export async function generateMetadata(props: PageProps<"/patients/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: `Patient ${decodeURIComponent(id)}` };
}

export default async function PatientDetailPage(props: PageProps<"/patients/[id]">) {
  const { id } = await props.params;
  return <PatientDetailView id={decodeURIComponent(id)} />;
}

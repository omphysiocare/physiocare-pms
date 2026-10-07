import type { Metadata } from "next";

import { PatientEditView } from "@/features/patients/PatientFormViews";

export const metadata: Metadata = { title: "Edit Patient" };

export default async function EditPatientPage(props: PageProps<"/patients/[id]/edit">) {
  const { id } = await props.params;
  return <PatientEditView id={decodeURIComponent(id)} />;
}

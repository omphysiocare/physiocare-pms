import type { Metadata } from "next";

import { ConsultationEditView } from "@/features/consultations/ConsultationFormViews";

export const metadata: Metadata = { title: "Edit Consultation" };

export default async function EditConsultationPage(props: PageProps<"/consultations/[id]/edit">) {
  const { id } = await props.params;
  return <ConsultationEditView id={decodeURIComponent(id)} />;
}

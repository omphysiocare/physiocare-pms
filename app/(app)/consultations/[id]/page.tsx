import type { Metadata } from "next";

import ConsultationDetailView from "@/features/consultations/ConsultationDetailView";

export async function generateMetadata(props: PageProps<"/consultations/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: `Consultation ${decodeURIComponent(id)}` };
}

export default async function ConsultationDetailPage(props: PageProps<"/consultations/[id]">) {
  const { id } = await props.params;
  return <ConsultationDetailView id={decodeURIComponent(id)} />;
}

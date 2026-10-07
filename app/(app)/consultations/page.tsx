import type { Metadata } from "next";

import ConsultationListView from "@/features/consultations/ConsultationListView";

export const metadata: Metadata = { title: "Consultations" };

export default function ConsultationsPage() {
  return <ConsultationListView />;
}

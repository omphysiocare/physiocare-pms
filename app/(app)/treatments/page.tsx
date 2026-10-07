import type { Metadata } from "next";

import ServiceRecordListView from "@/features/services/ServiceRecordListView";

export const metadata: Metadata = { title: "Clinical Services" };

export default function TreatmentsPage() {
  return <ServiceRecordListView />;
}

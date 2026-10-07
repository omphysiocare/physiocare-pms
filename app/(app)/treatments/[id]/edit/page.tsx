import type { Metadata } from "next";

import { ServiceRecordEditView } from "@/features/services/ServiceRecordFormViews";

export const metadata: Metadata = { title: "Edit Service" };

export default async function EditServiceRecordPage(props: PageProps<"/treatments/[id]/edit">) {
  const { id } = await props.params;
  return <ServiceRecordEditView id={decodeURIComponent(id)} />;
}

import type { Metadata } from "next";

import ServiceRecordDetailView from "@/features/services/ServiceRecordDetailView";

export async function generateMetadata(props: PageProps<"/treatments/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: decodeURIComponent(id) };
}

export default async function ServiceRecordPage(props: PageProps<"/treatments/[id]">) {
  const { id } = await props.params;
  return <ServiceRecordDetailView id={decodeURIComponent(id)} />;
}

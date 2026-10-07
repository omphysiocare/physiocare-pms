import type { Metadata } from "next";

import InvoiceDetailView from "@/features/billing/InvoiceDetailView";

export async function generateMetadata(props: PageProps<"/billing/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: `Invoice ${decodeURIComponent(id)}` };
}

export default async function InvoiceDetailPage(props: PageProps<"/billing/[id]">) {
  const { id } = await props.params;
  return <InvoiceDetailView id={decodeURIComponent(id)} />;
}

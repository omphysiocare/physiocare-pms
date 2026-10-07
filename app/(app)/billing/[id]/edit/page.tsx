import type { Metadata } from "next";

import { InvoiceEditView } from "@/features/billing/InvoiceFormViews";

export const metadata: Metadata = { title: "Edit Invoice" };

export default async function EditInvoicePage(props: PageProps<"/billing/[id]/edit">) {
  const { id } = await props.params;
  return <InvoiceEditView id={decodeURIComponent(id)} />;
}

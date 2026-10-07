import type { Metadata } from "next";

import BillingListView from "@/features/billing/BillingListView";

export const metadata: Metadata = { title: "Billing" };

export default function BillingPage() {
  return <BillingListView />;
}

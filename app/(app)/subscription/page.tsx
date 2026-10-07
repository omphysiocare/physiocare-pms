import type { Metadata } from "next";

import SubscriptionView from "@/features/subscription/SubscriptionView";

export const metadata: Metadata = { title: "Subscription" };

export default function SubscriptionPage() {
  return <SubscriptionView />;
}

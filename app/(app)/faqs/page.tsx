import type { Metadata } from "next";

import FaqView from "@/features/support/FaqView";

export const metadata: Metadata = { title: "FAQs" };

export default function FaqPage() {
  return <FaqView />;
}

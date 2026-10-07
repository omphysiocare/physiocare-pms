import type { Metadata } from "next";

import ReportsHub from "@/features/reports/ReportsHub";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return <ReportsHub />;
}

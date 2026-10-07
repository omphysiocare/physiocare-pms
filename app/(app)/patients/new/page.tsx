import type { Metadata } from "next";

import { PatientCreateView } from "@/features/patients/PatientFormViews";

export const metadata: Metadata = { title: "Register Patient" };

export default function NewPatientPage() {
  return <PatientCreateView />;
}

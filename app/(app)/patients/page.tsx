import type { Metadata } from "next";

import PatientListView from "@/features/patients/PatientListView";

export const metadata: Metadata = { title: "Patients" };

export default function PatientsPage() {
  return <PatientListView />;
}

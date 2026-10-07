import { formatId } from "@/lib/ids";
import { SPECIALTIES } from "@/lib/specialties";
import type { ClinicalService } from "@/types";

import { CLINIC_ID } from "./clinics";

const created = "2024-04-01T09:00:00.000Z";

const CONSULTATION_SERVICES = [
  { name: "Initial Consultation & Assessment", category: "Consultation", durationMinutes: 45, price: 800, taxRate: 0, description: "First visit with detailed assessment." },
  { name: "Follow-up Consultation", category: "Consultation", durationMinutes: 30, price: 500, taxRate: 0, description: "Review visit." },
];

export const SERVICES_SEED: ClinicalService[] = [...CONSULTATION_SERVICES, ...SPECIALTIES.physiotherapy.defaultServices].map((service, index) => ({
  ...service,
  id: formatId("SVC", index + 1, 3),
  clinicId: CLINIC_ID,
  code: formatId("PT", index + 1, 2),
  specialty: "physiotherapy",
  active: true,
  createdAt: created,
  updatedAt: created,
}));

export const CONSULTATION_SERVICE_ID = SERVICES_SEED[0].id;
export const FOLLOW_UP_SERVICE_ID = SERVICES_SEED[1].id;

export function serviceByName(name: string): ClinicalService {
  const service = SERVICES_SEED.find((item) => item.name === name);
  if (!service) throw new Error(`Unknown seed service: ${name}`);
  return service;
}

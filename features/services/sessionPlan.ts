import type { ConsultationWithRelations, ServiceRecordWithRelations } from "@/types";

export interface SessionSuggestion {
  consultationId: string;
  diagnosis: string;
  sessionNumber: number;
  totalSessions: number;
  serviceId: string | null;
  area: string;
}

/** Suggests the next session in the patient's active plan of care. */
export function suggestNextSession(consultations: ConsultationWithRelations[], records: ServiceRecordWithRelations[], consultationId?: string): SessionSuggestion | null {
  const plan = consultations.find((item) => item.id === consultationId) ?? [...consultations].filter((item) => item.plannedSessions > 0).sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!plan || plan.plannedSessions === 0) return null;
  const sessions = records.filter((item) => item.consultationId === plan.id && item.status !== "Cancelled");
  const last = [...sessions].sort((a, b) => b.sessionNumber - a.sessionNumber)[0];
  return {
    consultationId: plan.id,
    diagnosis: plan.diagnosis,
    sessionNumber: Math.min((last?.sessionNumber ?? 0) + 1, plan.plannedSessions),
    totalSessions: plan.plannedSessions,
    serviceId: last?.serviceId ?? null,
    area: last?.area ?? "",
  };
}

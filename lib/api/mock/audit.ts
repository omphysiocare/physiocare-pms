import { getActorId } from "@/lib/api/session";
import { nextId } from "@/lib/ids";
import type { ActivityAction, ActivityModule } from "@/types";

import { getDb, nowISO } from "./db";

/** Appends an audit entry for the current actor. The backend will do this server-side. */
export function logActivity(action: ActivityAction, module: ActivityModule, recordId: string, description: string, branchId: string | null = null): void {
  const db = getDb();
  const memberId = getActorId();
  db.activity.push({
    id: nextId("ACT", db.activity.map((log) => log.id), 5),
    clinicId: db.clinic.id,
    branchId,
    at: nowISO(),
    memberId,
    memberName: db.members.find((member) => member.id === memberId)?.name ?? "Unknown",
    action,
    module,
    recordId,
    description,
  });
}

export function actorName(): string {
  const memberId = getActorId();
  return getDb().members.find((member) => member.id === memberId)?.name ?? "Unknown";
}

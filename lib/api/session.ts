/**
 * Identity of the signed-in member for the data layer. In live mode the backend
 * derives this from the access token; the mock layer uses it to attribute
 * payments, messages and audit entries.
 */
const SESSION_KEY = "physio-pms:session-member";
export const DEFAULT_MEMBER_ID = "MEM-001";

let actorId: string | null = null;

export function getActorId(): string {
  if (actorId) return actorId;
  if (typeof window !== "undefined") {
    try {
      actorId = window.localStorage.getItem(SESSION_KEY);
    } catch {
      actorId = null;
    }
  }
  return actorId ?? DEFAULT_MEMBER_ID;
}

export function setActorId(memberId: string): void {
  actorId = memberId;
  try {
    window.localStorage.setItem(SESSION_KEY, memberId);
  } catch {
    // Storage unavailable — keep in memory only.
  }
}

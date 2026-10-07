import { http } from "@/lib/api/client";
import { isMockApi } from "@/lib/api/config";
import { ApiError } from "@/lib/api/errors";
import { logActivity } from "@/lib/api/mock/audit";
import { findOrThrow, insertRecord, removeRecord, updateRecord } from "@/lib/api/mock/crud";
import { getDb } from "@/lib/api/mock/db";
import { run } from "@/lib/api/mock/run";
import { getActorId } from "@/lib/api/session";
import { ID_PREFIX } from "@/lib/ids";
import type { CreateInput, Member, MemberRole, MemberStatus } from "@/types";

export type MemberInput = Omit<CreateInput<Member>, "lastActiveAt">;

export interface MemberStats {
  appointments: number;
  consultations: number;
  services: number;
  revenue: number;
}

export interface MemberService {
  list(): Promise<Member[]>;
  get(id: string): Promise<Member & { stats: MemberStats }>;
  invite(input: MemberInput): Promise<Member>;
  update(id: string, input: MemberInput): Promise<Member>;
  setStatus(id: string, status: MemberStatus): Promise<Member>;
  remove(id: string): Promise<void>;
}

/** The clinic must always keep at least one active Owner. */
function assertOwnerRemains(id: string, change: { role?: MemberRole; status?: MemberStatus; removed?: boolean }) {
  const members = getDb().members;
  const member = findOrThrow(members, id, "Member");
  if (member.role !== "Owner") return;
  const stillOwner = !change.removed && (change.role ?? member.role) === "Owner" && (change.status ?? member.status) === "Active";
  if (stillOwner) return;
  if (!members.some((m) => m.id !== id && m.role === "Owner" && m.status === "Active")) {
    throw new ApiError("The clinic must always have at least one active Owner.", 409);
  }
}

const mockMemberService: MemberService = {
  list: () => run(() => [...getDb().members].sort((a, b) => a.name.localeCompare(b.name))),
  get: (id) =>
    run(() => {
      const db = getDb();
      const member = findOrThrow(db.members, id, "Member");
      const invoices = db.invoices.filter((invoice) => invoice.providerId === id && !invoice.cancelled);
      return {
        ...member,
        stats: {
          appointments: db.appointments.filter((a) => a.providerId === id).length,
          consultations: db.consultations.filter((c) => c.providerId === id).length,
          services: db.serviceRecords.filter((s) => s.providerId === id && s.status === "Completed").length,
          revenue: invoices.reduce((sum, invoice) => sum + invoice.payments.reduce((t, p) => t + (p.kind === "refund" ? -p.amount : p.amount), 0), 0),
        },
      };
    }),
  invite: (input) =>
    run(() => {
      const db = getDb();
      if (db.members.some((m) => m.email.toLowerCase() === input.email.toLowerCase())) {
        throw new ApiError("A member with this email already exists.", 409);
      }
      const member = insertRecord<Member>(db.members, ID_PREFIX.member, { ...input, status: "Invited", lastActiveAt: null }, 3);
      logActivity("invited", "Members", member.id, `Invited ${member.name} as ${member.role}`);
      return member;
    }),
  update: (id, input) =>
    run(() => {
      assertOwnerRemains(id, { role: input.role });
      const member = updateRecord(getDb().members, id, input, "Member");
      logActivity("updated", "Members", id, `Updated member ${member.name}`);
      return member;
    }),
  setStatus: (id, status) =>
    run(() => {
      if (id === getActorId() && status !== "Active") throw new ApiError("You cannot deactivate your own account.", 409);
      assertOwnerRemains(id, { status });
      const member = updateRecord(getDb().members, id, { status }, "Member");
      logActivity("status_changed", "Members", id, `${status === "Active" ? "Activated" : "Deactivated"} ${member.name}`);
      return member;
    }),
  remove: (id) =>
    run(() => {
      const db = getDb();
      if (id === getActorId()) throw new ApiError("You cannot remove your own account.", 409);
      assertOwnerRemains(id, { removed: true });
      const hasRecords = db.appointments.some((a) => a.providerId === id) || db.consultations.some((c) => c.providerId === id);
      if (hasRecords) throw new ApiError("This member has clinical records. Deactivate them instead to preserve history.", 409);
      const removed = removeRecord(db.members, id, "Member");
      logActivity("deleted", "Members", id, `Removed member ${removed.name}`);
    }),
};

const httpMemberService: MemberService = {
  list: () => http.get<Member[]>("/members"),
  get: (id) => http.get<Member & { stats: MemberStats }>(`/members/${id}`),
  invite: (input) => http.post<Member>("/members/invite", input),
  update: (id, input) => http.put<Member>(`/members/${id}`, input),
  setStatus: (id, status) => http.patch<Member>(`/members/${id}/status`, { status }),
  remove: (id) => http.delete(`/members/${id}`),
};

export const memberService = isMockApi ? mockMemberService : httpMemberService;

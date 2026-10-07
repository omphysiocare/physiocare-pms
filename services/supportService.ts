import { http } from "@/lib/api/client";
import { isMockApi } from "@/lib/api/config";
import { actorName, logActivity } from "@/lib/api/mock/audit";
import { findOrThrow } from "@/lib/api/mock/crud";
import { commit, getDb, nowISO } from "@/lib/api/mock/db";
import { run } from "@/lib/api/mock/run";
import { getActorId } from "@/lib/api/session";
import { ID_PREFIX, nextId } from "@/lib/ids";
import { FAQS_SEED } from "@/mock/faqs";
import type { Faq, SupportTicket, TicketCategory, TicketPriority, TicketStatus } from "@/types";

export interface CreateTicketInput {
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  message: string;
}

export interface SupportService {
  listFaqs(): Promise<Faq[]>;
  listTickets(): Promise<SupportTicket[]>;
  getTicket(id: string): Promise<SupportTicket>;
  createTicket(input: CreateTicketInput): Promise<SupportTicket>;
  reply(id: string, body: string): Promise<SupportTicket>;
  updateTicket(id: string, patch: { status?: TicketStatus; priority?: TicketPriority }): Promise<SupportTicket>;
}

const mockSupportService: SupportService = {
  listFaqs: () => run(() => FAQS_SEED, 80),
  listTickets: () => run(() => [...getDb().supportTickets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))),
  getTicket: (id) => run(() => findOrThrow(getDb().supportTickets, id, "Ticket")),
  createTicket: (input) =>
    run(() => {
      const db = getDb();
      const now = nowISO();
      const name = actorName();
      const ticket: SupportTicket = {
        id: nextId(ID_PREFIX.ticket, db.supportTickets.map((t) => t.id)),
        clinicId: db.clinic.id,
        subject: input.subject,
        category: input.category,
        priority: input.priority,
        status: "Open",
        createdBy: getActorId(),
        createdByName: name,
        createdAt: now,
        updatedAt: now,
        messages: [{ id: "m1", author: { type: "member", name }, body: input.message, at: now }],
        history: [{ at: now, text: `Ticket opened by ${name}` }],
      };
      db.supportTickets.push(ticket);
      commit();
      logActivity("created", "Support", ticket.id, `Opened support ticket "${ticket.subject}"`);
      return ticket;
    }),
  reply: (id, body) =>
    run(() => {
      const ticket = findOrThrow(getDb().supportTickets, id, "Ticket");
      const now = nowISO();
      ticket.messages.push({ id: `m${ticket.messages.length + 1}`, author: { type: "member", name: actorName() }, body, at: now });
      if (ticket.status === "Resolved" || ticket.status === "Closed") {
        ticket.status = "Open";
        ticket.history.push({ at: now, text: "Reopened by new reply" });
      }
      ticket.updatedAt = now;
      commit();
      return ticket;
    }),
  updateTicket: (id, patch) =>
    run(() => {
      const ticket = findOrThrow(getDb().supportTickets, id, "Ticket");
      const now = nowISO();
      if (patch.status && patch.status !== ticket.status) ticket.history.push({ at: now, text: `Status changed to ${patch.status} by ${actorName()}` });
      if (patch.priority && patch.priority !== ticket.priority) ticket.history.push({ at: now, text: `Priority changed to ${patch.priority} by ${actorName()}` });
      Object.assign(ticket, patch, { updatedAt: now });
      commit();
      logActivity("updated", "Support", id, `Updated ticket ${id}`);
      return ticket;
    }),
};

const httpSupportService: SupportService = {
  listFaqs: () => http.get<Faq[]>("/support/faqs"),
  listTickets: () => http.get<SupportTicket[]>("/support/tickets"),
  getTicket: (id) => http.get<SupportTicket>(`/support/tickets/${id}`),
  createTicket: (input) => http.post<SupportTicket>("/support/tickets", input),
  reply: (id, body) => http.post<SupportTicket>(`/support/tickets/${id}/replies`, { body }),
  updateTicket: (id, patch) => http.patch<SupportTicket>(`/support/tickets/${id}`, patch),
};

export const supportService = isMockApi ? mockSupportService : httpSupportService;

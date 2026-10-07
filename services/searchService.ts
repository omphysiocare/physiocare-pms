import { http } from "@/lib/api/client";
import { isMockApi } from "@/lib/api/config";
import { getDb } from "@/lib/api/mock/db";
import { patientName, toPatientRef } from "@/lib/api/mock/relations";
import { run } from "@/lib/api/mock/run";
import { formatDate, formatTime } from "@/lib/format";
import { matchesSearch } from "@/lib/search";

export type SearchResultType = "patient" | "appointment" | "consultation" | "serviceRecord" | "invoice" | "expense" | "member";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  href: string;
}

export interface SearchService {
  search(query: string): Promise<SearchResult[]>;
}

const LIMIT = 4;

const mockSearchService: SearchService = {
  search: (query) =>
    run(() => {
      const q = query.trim();
      if (q.length < 2) return [];
      const db = getDb();
      const nameOf = (patientId: string) => toPatientRef(patientId).name;
      const byIdOrPatient = <T extends { id: string; patientId: string }>(items: T[]) =>
        items.filter((item) => matchesSearch(q, item.id) || matchesSearch(q, nameOf(item.patientId)));
      const prefix = (p: string) => q.toUpperCase().startsWith(p);

      const results: SearchResult[] = [
        ...db.patients
          .filter((p) => matchesSearch(q, p.id, patientName(p), p.phone, p.alternatePhone, p.email, p.medical.primaryCondition))
          .slice(0, LIMIT)
          .map((p) => ({ id: p.id, type: "patient" as const, title: patientName(p), subtitle: `${p.id} · ${p.phone}`, href: `/patients/${p.id}` })),
        ...byIdOrPatient(db.appointments)
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, LIMIT)
          .map((a) => ({ id: a.id, type: "appointment" as const, title: `${a.id} · ${nameOf(a.patientId)}`, subtitle: `${a.type} · ${formatDate(a.date)} ${formatTime(a.startTime)} · ${a.status}`, href: `/appointments/${a.id}` })),
        ...(prefix("CON") ? db.consultations.filter((c) => matchesSearch(q, c.id)).slice(0, LIMIT) : []).map((c) => ({ id: c.id, type: "consultation" as const, title: `${c.id} · ${nameOf(c.patientId)}`, subtitle: c.diagnosis, href: `/consultations/${c.id}` })),
        ...(prefix("SR") ? db.serviceRecords.filter((r) => matchesSearch(q, r.id)).slice(0, LIMIT) : []).map((r) => ({ id: r.id, type: "serviceRecord" as const, title: `${r.id} · ${nameOf(r.patientId)}`, subtitle: r.serviceName, href: `/treatments/${r.id}` })),
        ...byIdOrPatient(db.invoices)
          .sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate))
          .slice(0, LIMIT)
          .map((i) => ({ id: i.id, type: "invoice" as const, title: `${i.id} · ${nameOf(i.patientId)}`, subtitle: formatDate(i.invoiceDate), href: `/billing/${i.id}` })),
        ...db.expenses
          .filter((e) => matchesSearch(q, e.id, e.description, e.vendor))
          .slice(0, LIMIT)
          .map((e) => ({ id: e.id, type: "expense" as const, title: `${e.id} · ${e.description}`, subtitle: `${e.category} · ${formatDate(e.date)}`, href: `/expenses/${e.id}` })),
        ...db.members
          .filter((m) => matchesSearch(q, m.name, m.email, m.id))
          .slice(0, LIMIT)
          .map((m) => ({ id: m.id, type: "member" as const, title: m.name, subtitle: `${m.role} · ${m.email}`, href: `/members/${m.id}` })),
      ];
      return results;
    }, 120),
};

const httpSearchService: SearchService = {
  search: (query) => http.get<SearchResult[]>("/search", { q: query }),
};

export const searchService = isMockApi ? mockSearchService : httpSearchService;

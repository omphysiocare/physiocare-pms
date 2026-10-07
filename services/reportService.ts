import { http } from "@/lib/api/client";
import { isMockApi } from "@/lib/api/config";
import { logActivity } from "@/lib/api/mock/audit";
import { getDb } from "@/lib/api/mock/db";
import { run } from "@/lib/api/mock/run";
import { computeReport } from "@/lib/reports/compute";
import { getReportDefinition } from "@/lib/reports/definitions";
import type { ReportFilters, ReportResult, ReportSlug } from "@/types";

export interface ReportService {
  getReport(slug: ReportSlug, filters: ReportFilters): Promise<ReportResult>;
  /** Records an export in the audit log (CSV/PDF/print). */
  logExport(slug: ReportSlug, format: "CSV" | "PDF" | "Print"): Promise<void>;
}

const mockReportService: ReportService = {
  getReport: (slug, filters) => run(() => computeReport(getDb(), slug, filters), 300),
  logExport: (slug, format) =>
    run(() => {
      logActivity("exported", "Reports", slug, `Exported ${getReportDefinition(slug)?.title ?? slug} as ${format}`);
    }, 0),
};

const httpReportService: ReportService = {
  getReport: (slug, filters) => http.get<ReportResult>(`/reports/${slug}`, filters),
  logExport: (slug, format) => http.post(`/reports/${slug}/exports`, { format }),
};

export const reportService = isMockApi ? mockReportService : httpReportService;

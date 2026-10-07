import { csvValue } from "@/lib/reports/format";
import type { ReportResult } from "@/types";

import { datedFileName, downloadBlob } from "./download";

function escape(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(escape).join(",")).join("\r\n");
}

/** Generic CSV download; a BOM is added so Excel opens UTF-8 (₹, names) correctly. */
export function downloadCsv(fileName: string, rows: string[][]): void {
  downloadBlob(new Blob([`﻿${toCsv(rows)}`], { type: "text/csv;charset=utf-8" }), fileName);
}

/** Exports exactly the filtered rows shown in a report, plus filters and totals for context. */
export function exportReportCsv(report: ReportResult): string {
  const header = report.columns.map((column) => column.label);
  const body = report.rows.map((row) => report.columns.map((column) => csvValue(row[column.key], column.format)));
  const rows: string[][] = [
    [report.title],
    ...report.appliedFilters.map((filter) => [filter.label, filter.value]),
    [],
    header,
    ...body,
  ];
  if (report.totals) rows.push(report.columns.map((column) => csvValue(report.totals?.[column.key] ?? null, column.format)));
  const fileName = datedFileName(`${report.slug}-report`, "csv");
  downloadCsv(fileName, rows);
  return fileName;
}

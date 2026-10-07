import { Box } from "@mui/material";

import { formatDateTime } from "@/lib/format";
import { formatReportValue } from "@/lib/reports/format";
import type { Clinic, ReportResult } from "@/types";

import PrintableLayout, { printStyles } from "./PrintableLayout";

/** Print version of any report: summary, compact breakdowns and the full table. */
export function ReportDocument({ clinic, report }: { clinic: Clinic; report: ReportResult }) {
  const breakdowns = report.charts.filter((chart) => chart.type === "breakdown" && chart.data.length > 0).slice(0, 3);
  return (
    <PrintableLayout
      clinic={clinic}
      title={report.title}
      meta={[...report.appliedFilters.map((filter) => [filter.label, filter.value] as [string, string]), ["Generated", formatDateTime(report.generatedAt)]]}
      footerNote={report.description}
    >
      <h3>Summary</h3>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, mb: 1 }}>
        {report.summary.map((item) => (
          <Box key={item.label} sx={{ border: "1px solid #E2E8F0", borderRadius: 1, p: 1 }}>
            <Box sx={{ fontSize: 9.5, color: "#64748B" }}>{item.label}</Box>
            <Box sx={{ fontSize: 14, fontWeight: 700 }}>{formatReportValue(item.value, item.format)}</Box>
          </Box>
        ))}
      </Box>
      {breakdowns.length > 0 && (
        <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${breakdowns.length}, 1fr)`, gap: 2 }}>
          {breakdowns.map((chart) => {
            const max = Math.max(...chart.data.map((point) => Number(point.value)), 1);
            return (
              <Box key={chart.id} sx={{ breakInside: "avoid" }}>
                <h3>{chart.title}</h3>
                {chart.data.slice(0, 8).map((point) => (
                  <Box key={String(point.label)} sx={{ fontSize: 10, mb: 0.5 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <span>{point.label}</span>
                      <strong>{formatReportValue(Number(point.value), chart.format)}</strong>
                    </Box>
                    <Box sx={{ height: 5, background: "#F1F5F9", borderRadius: 2 }}>
                      <Box sx={{ height: 5, width: `${(Number(point.value) / max) * 100}%`, background: clinic.branding.accentColor, borderRadius: 2, printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            );
          })}
        </Box>
      )}
      <h3>Details ({report.rows.length})</h3>
      <Box component="table" sx={{ ...printStyles.table, fontSize: report.columns.length > 8 ? 9 : 10.5 }}>
        <thead>
          <tr>
            {report.columns.map((column) => (
              <th key={column.key} className={column.align === "right" ? "num" : undefined}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.rows.map((row, index) => (
            <tr key={index}>
              {report.columns.map((column) => (
                <td key={column.key} className={column.align === "right" ? "num" : undefined}>
                  {formatReportValue(row[column.key], column.format)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {report.totals && (
          <tfoot>
            <tr>
              {report.columns.map((column) => (
                <td key={column.key} className={column.align === "right" ? "num" : undefined}>
                  {formatReportValue(report.totals?.[column.key] ?? null, column.format)}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </Box>
    </PrintableLayout>
  );
}

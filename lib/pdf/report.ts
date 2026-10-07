import type { jsPDF } from "jspdf";

import { formatReportValue } from "@/lib/reports/format";
import type { Clinic, ReportChart, ReportResult } from "@/types";

import { createDocument, drawFooters, drawLetterhead, ensureSpace, hexToRgb, PAGE, sectionTitle, table } from "./base";

const SERIES_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"];

/** Simple vector bar chart so report PDFs include visuals without rasterising the DOM. */
function drawChart(doc: jsPDF, chart: ReportChart, y: number): number {
  const height = 46;
  y = ensureSpace(doc, y, height + 14);
  y = sectionTitle(doc, chart.title, y);
  const width = doc.internal.pageSize.getWidth() - PAGE.margin * 2;
  const data = chart.data.slice(-24);
  const series = chart.series.slice(0, 4);
  const values = data.flatMap((point) => series.map((s) => Number(point[s.key]) || 0));
  const max = Math.max(...values.map(Math.abs), 1);
  const left = PAGE.margin + 22;
  const plotWidth = width - 22;
  const baseY = y + height - 8;

  doc.setDrawColor("#E2E8F0");
  doc.setFontSize(6.5);
  doc.setTextColor("#64748B");
  [0, 0.5, 1].forEach((fraction) => {
    const lineY = baseY - (height - 12) * fraction;
    doc.line(left, lineY, left + plotWidth, lineY);
    doc.text(formatReportValue(max * fraction, chart.format, true), left - 2, lineY + 1, { align: "right" });
  });

  const groupWidth = plotWidth / Math.max(data.length, 1);
  const barWidth = Math.min(6, (groupWidth * 0.75) / series.length);
  data.forEach((point, index) => {
    series.forEach((s, seriesIndex) => {
      const value = Math.max(0, Number(point[s.key]) || 0);
      const barHeight = (value / max) * (height - 12);
      const x = left + index * groupWidth + (groupWidth - barWidth * series.length) / 2 + seriesIndex * barWidth;
      doc.setFillColor(...hexToRgb(SERIES_COLORS[seriesIndex]));
      doc.rect(x, baseY - barHeight, barWidth - 0.4, barHeight, "F");
    });
    if (data.length <= 16 || index % Math.ceil(data.length / 12) === 0) {
      doc.text(String(point.label).slice(0, 12), left + index * groupWidth + groupWidth / 2, baseY + 4, { align: "center" });
    }
  });
  if (series.length > 1) {
    series.forEach((s, index) => {
      doc.setFillColor(...hexToRgb(SERIES_COLORS[index]));
      doc.rect(left + index * 32, y + height - 1, 3, 3, "F");
      doc.text(s.label, left + index * 32 + 4.5, y + height + 1.5);
    });
  }
  return y + height + 6;
}

export function buildReportPdf({ clinic, report }: { clinic: Clinic; report: ReportResult }) {
  const landscape = report.columns.length > 7;
  const doc = createDocument(landscape ? "landscape" : "portrait");
  let y = drawLetterhead(doc, clinic, {
    title: report.title,
    meta: report.appliedFilters.slice(0, 5).map((filter) => [filter.label, filter.value]),
  });

  y = sectionTitle(doc, "Summary", y);
  y = table(doc, {
    startY: y,
    accent: clinic.branding.accentColor,
    head: [report.summary.slice(0, 6).map((item) => item.label)],
    body: [report.summary.slice(0, 6).map((item) => formatReportValue(item.value, item.format, false, true))],
    styles: { halign: "center", fontSize: 8.5 },
  });
  if (report.summary.length > 6) {
    y = table(doc, {
      startY: y - 3,
      accent: clinic.branding.accentColor,
      head: [report.summary.slice(6, 12).map((item) => item.label)],
      body: [report.summary.slice(6, 12).map((item) => formatReportValue(item.value, item.format, false, true))],
      styles: { halign: "center", fontSize: 8.5 },
    });
  }

  report.charts
    .filter((chart) => chart.type !== "breakdown" && chart.data.length > 0)
    .slice(0, 1)
    .forEach((chart) => {
      y = drawChart(doc, chart, y);
    });
  report.charts
    .filter((chart) => chart.type === "breakdown" && chart.data.length > 0)
    .slice(0, 2)
    .forEach((chart) => {
      y = ensureSpace(doc, y, 30);
      y = sectionTitle(doc, chart.title, y);
      y = table(doc, {
        startY: y,
        accent: clinic.branding.accentColor,
        head: [["", "Value"]],
        body: chart.data.map((point) => [String(point.label), formatReportValue(Number(point.value), chart.format, false, true)]),
        columnStyles: { 1: { halign: "right" } },
        tableWidth: 110,
      });
    });

  y = ensureSpace(doc, y, 30);
  y = sectionTitle(doc, `Details (${report.rows.length} rows)`, y);
  table(doc, {
    startY: y,
    accent: clinic.branding.accentColor,
    head: [report.columns.map((column) => column.label)],
    body: report.rows.map((row) => report.columns.map((column) => formatReportValue(row[column.key], column.format, false, true))),
    foot: report.totals ? [report.columns.map((column) => formatReportValue(report.totals?.[column.key] ?? null, column.format, false, true))] : undefined,
    columnStyles: Object.fromEntries(report.columns.map((column, index) => [index, { halign: column.align === "right" ? "right" : "left" }])),
    styles: { fontSize: report.columns.length > 9 ? 7 : 8 },
  });
  drawFooters(doc, clinic, `${report.title} · ${report.description}`);
  return doc;
}

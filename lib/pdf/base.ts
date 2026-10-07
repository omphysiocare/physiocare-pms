import { jsPDF } from "jspdf";
import { autoTable, type UserOptions } from "jspdf-autotable";

import { formatDate, formatDateTime } from "@/lib/format";
import type { Clinic } from "@/types";

/**
 * Shared letterhead, typography and table styles for every generated PDF
 * (invoice, receipt, prescription, reports) so all documents look the same.
 */
export const PAGE = { width: 210, height: 297, margin: 14 };
const INK = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";

/** jsPDF's built-in fonts have no ₹ glyph, so PDFs use "Rs.". */
export function pdfMoney(value: number): string {
  return `Rs. ${value.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const value = parseInt(clean.length === 3 ? clean.replace(/(.)/g, "$1$1") : clean, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export interface DocumentMeta {
  title: string;
  /** Right-aligned key/value lines under the title, e.g. invoice number and date. */
  meta?: [string, string][];
}

export function createDocument(orientation: "portrait" | "landscape" = "portrait"): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(INK);
  return doc;
}

function pageWidth(doc: jsPDF) {
  return doc.internal.pageSize.getWidth();
}

function pageHeight(doc: jsPDF) {
  return doc.internal.pageSize.getHeight();
}

/** Draws the clinic letterhead and returns the Y position below it. */
export function drawLetterhead(doc: jsPDF, clinic: Clinic, header: DocumentMeta, branchLine?: string): number {
  const width = pageWidth(doc);
  const accent = hexToRgb(clinic.branding.accentColor || "#2563EB");
  doc.setFillColor(...accent);
  doc.rect(0, 0, width, 3, "F");

  let x = PAGE.margin;
  if (clinic.branding.showLogo && clinic.logo) {
    try {
      const format = clinic.logo.includes("image/png") ? "PNG" : "JPEG";
      doc.addImage(clinic.logo, format, PAGE.margin, 9, 18, 18);
      x += 22;
    } catch {
      // Unsupported image — continue without logo.
    }
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(INK);
  doc.text(clinic.name, x, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(MUTED);
  const lines = [
    `${clinic.address}, ${clinic.city}, ${clinic.state} ${clinic.pincode}`,
    branchLine,
    [clinic.phone, clinic.email, clinic.website].filter(Boolean).join("  ·  "),
    [clinic.registrationNumber && `Reg. No: ${clinic.registrationNumber}`, clinic.gstin && `GSTIN: ${clinic.gstin}`].filter(Boolean).join("  ·  "),
  ].filter(Boolean) as string[];
  lines.forEach((line, index) => doc.text(doc.splitTextToSize(line, 110)[0], x, 20 + index * 4));

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...accent);
  doc.text(header.title.toUpperCase(), width - PAGE.margin, 15, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  (header.meta ?? []).forEach(([label, value], index) => {
    doc.setTextColor(MUTED);
    doc.text(`${label}:`, width - PAGE.margin - 38, 21 + index * 4.5, { align: "right" });
    doc.setTextColor(INK);
    doc.text(value, width - PAGE.margin, 21 + index * 4.5, { align: "right" });
  });

  const bottom = Math.max(20 + lines.length * 4, 21 + (header.meta?.length ?? 0) * 4.5) + 3;
  doc.setDrawColor(BORDER);
  doc.line(PAGE.margin, bottom, width - PAGE.margin, bottom);
  return bottom + 6;
}

export function sectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(INK);
  doc.text(text, PAGE.margin, y);
  return y + 5;
}

/** Two-column label/value block. Returns the Y below it. */
export function keyValues(doc: jsPDF, pairs: [string, string][], y: number, columns = 2): number {
  const width = pageWidth(doc) - PAGE.margin * 2;
  const colWidth = width / columns;
  doc.setFontSize(8.5);
  let rowY = y;
  pairs.forEach(([label, value], index) => {
    const col = index % columns;
    if (col === 0 && index > 0) rowY += 9;
    const x = PAGE.margin + col * colWidth;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(MUTED);
    doc.text(label, x, rowY);
    doc.setTextColor(INK);
    doc.setFont("helvetica", "bold");
    doc.text(doc.splitTextToSize(value || "—", colWidth - 4)[0], x, rowY + 4);
  });
  return rowY + 10;
}

export function paragraph(doc: jsPDF, label: string, text: string, y: number): number {
  if (!text) return y;
  y = ensureSpace(doc, y, 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(MUTED);
  doc.text(label, PAGE.margin, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(INK);
  const lines = doc.splitTextToSize(text, pageWidth(doc) - PAGE.margin * 2);
  doc.text(lines, PAGE.margin, y + 4.5);
  return y + 6 + lines.length * 4;
}

export function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed < pageHeight(doc) - 22) return y;
  doc.addPage();
  return PAGE.margin + 6;
}

export function table(doc: jsPDF, options: UserOptions & { accent?: string }): number {
  const accent = hexToRgb(options.accent ?? "#2563EB");
  autoTable(doc, {
    theme: "grid",
    margin: { left: PAGE.margin, right: PAGE.margin, bottom: 22 },
    styles: { font: "helvetica", fontSize: 8.5, textColor: INK, lineColor: BORDER, lineWidth: 0.2, cellPadding: 2.2 },
    headStyles: { fillColor: accent, textColor: "#FFFFFF", fontStyle: "bold" },
    footStyles: { fillColor: "#F1F5F9", textColor: INK, fontStyle: "bold" },
    alternateRowStyles: { fillColor: "#F8FAFC" },
    ...options,
  });
  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
  return (finalY ?? 0) + 6;
}

/** Footer on every page: clinic note, generation time and page numbers. */
export function drawFooters(doc: jsPDF, clinic: Clinic, note?: string): void {
  const pages = doc.getNumberOfPages();
  const width = pageWidth(doc);
  const height = pageHeight(doc);
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(BORDER);
    doc.line(PAGE.margin, height - 16, width - PAGE.margin, height - 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(MUTED);
    doc.text(doc.splitTextToSize(note ?? clinic.billingSettings.invoiceFooter, width - PAGE.margin * 2 - 40)[0] ?? "", PAGE.margin, height - 11);
    doc.text(`${clinic.name} · Generated ${formatDateTime(new Date().toISOString())}`, PAGE.margin, height - 7);
    doc.text(`Page ${page} of ${pages}`, width - PAGE.margin, height - 7, { align: "right" });
  }
}

export function signature(doc: jsPDF, label: string, name: string, y: number): number {
  y = ensureSpace(doc, y, 24);
  const x = pageWidth(doc) - PAGE.margin - 60;
  doc.setDrawColor("#94A3B8");
  doc.line(x, y + 14, x + 60, y + 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(INK);
  doc.text(name, x + 30, y + 19, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(MUTED);
  doc.text(label, x + 30, y + 23, { align: "center" });
  return y + 28;
}

export function dateLabel(date: string | null | undefined): string {
  return formatDate(date);
}

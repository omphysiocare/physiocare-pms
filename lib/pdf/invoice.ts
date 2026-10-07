import { calculateInvoiceTotals, lineAmount } from "@/lib/billing";
import type { Branch, Clinic, InvoiceWithRelations, Payment, PatientListItem } from "@/types";

import { createDocument, dateLabel, drawFooters, drawLetterhead, keyValues, paragraph, pdfMoney, sectionTitle, signature, table } from "./base";

export interface InvoiceDocumentData {
  clinic: Clinic;
  branch?: Branch;
  invoice: InvoiceWithRelations;
  patient: PatientListItem;
}

export function buildInvoicePdf({ clinic, branch, invoice, patient }: InvoiceDocumentData) {
  const doc = createDocument();
  const accent = clinic.branding.accentColor;
  let y = drawLetterhead(
    doc,
    clinic,
    {
      title: invoice.status === "Cancelled" ? "Invoice (Cancelled)" : "Tax Invoice",
      meta: [
        ["Invoice No", invoice.id],
        ["Invoice Date", dateLabel(invoice.invoiceDate)],
        ["Due Date", dateLabel(invoice.dueDate)],
        ["Status", invoice.status],
      ],
    },
    branch && !branch.isMain ? `${branch.name} branch: ${branch.address}` : undefined,
  );

  y = sectionTitle(doc, "Billed to", y);
  y = keyValues(
    doc,
    [
      ["Patient", `${patient.name} (${patient.id})`],
      ["Mobile", patient.phone],
      ["Address", [patient.address.line, patient.address.city].filter(Boolean).join(", ")],
      ["Provider", invoice.provider.name],
    ],
    y,
  );

  y = table(doc, {
    startY: y,
    accent,
    head: [["#", "Description", "Qty", "Rate", "Tax", "Amount"]],
    body: invoice.items.map((item, index) => [String(index + 1), item.description, String(item.quantity), pdfMoney(item.unitPrice), `${item.taxRate}%`, pdfMoney(lineAmount(item))]),
    columnStyles: { 0: { cellWidth: 8 }, 2: { halign: "right", cellWidth: 12 }, 3: { halign: "right" }, 4: { halign: "right", cellWidth: 14 }, 5: { halign: "right" } },
  });

  const totals = calculateInvoiceTotals(invoice);
  const rows: [string, string][] = [
    ["Subtotal", pdfMoney(totals.subtotal)],
    ...(totals.discount ? ([["Discount", `- ${pdfMoney(totals.discount)}`]] as [string, string][]) : []),
    ...(totals.tax ? ([["Tax", pdfMoney(totals.tax)]] as [string, string][]) : []),
    ["Total", pdfMoney(totals.total)],
    ["Paid", pdfMoney(totals.paid)],
    ...(totals.refunded ? ([["Refunded", pdfMoney(totals.refunded)]] as [string, string][]) : []),
    ["Balance Due", pdfMoney(invoice.status === "Cancelled" ? 0 : totals.balance)],
  ];
  y = table(doc, {
    startY: y - 2,
    accent,
    theme: "plain",
    margin: { left: 120, right: 14 },
    body: rows,
    columnStyles: { 0: { textColor: "#64748B" }, 1: { halign: "right", fontStyle: "bold" } },
    didParseCell: (data) => {
      if (data.row.index === rows.findIndex(([label]) => label === "Total")) data.cell.styles.fontSize = 10;
    },
  });

  const payments = invoice.payments;
  if (payments.length) {
    y = sectionTitle(doc, "Payment information", y);
    y = table(doc, {
      startY: y,
      accent,
      head: [["Receipt", "Date", "Method", "Reference", "Amount"]],
      body: payments.map((p: Payment) => [p.receiptNumber, dateLabel(p.date), p.kind === "refund" ? `Refund (${p.method})` : p.method, p.reference || "—", `${p.kind === "refund" ? "- " : ""}${pdfMoney(p.amount)}`]),
      columnStyles: { 4: { halign: "right" } },
    });
  }
  y = paragraph(doc, "Notes", invoice.notes, y);
  y = paragraph(doc, "Terms & conditions", clinic.billingSettings.termsAndConditions, y);
  signature(doc, clinic.branding.signatureLabel, `For ${clinic.name}`, y);
  drawFooters(doc, clinic);
  return doc;
}

export function buildReceiptPdf({ clinic, invoice, patient, payment }: InvoiceDocumentData & { payment: Payment }) {
  const doc = createDocument();
  const isRefund = payment.kind === "refund";
  let y = drawLetterhead(doc, clinic, {
    title: isRefund ? "Refund Note" : "Payment Receipt",
    meta: [
      [isRefund ? "Credit Note" : "Receipt No", payment.receiptNumber],
      ["Date", dateLabel(payment.date)],
      ["Invoice", invoice.id],
    ],
  });
  y = keyValues(
    doc,
    [
      [isRefund ? "Refunded to" : "Received from", `${patient.name} (${patient.id})`],
      ["Mobile", patient.phone],
      ["Amount", pdfMoney(payment.amount)],
      ["Payment method", payment.method],
      ["Reference", payment.reference || "—"],
      ["Towards invoice", `${invoice.id} dated ${dateLabel(invoice.invoiceDate)}`],
    ],
    y,
  );
  y = table(doc, {
    startY: y,
    accent: clinic.branding.accentColor,
    head: [["Invoice total", "Total paid", "Balance due"]],
    body: [[pdfMoney(invoice.total), pdfMoney(invoice.paid), pdfMoney(invoice.balance)]],
    styles: { halign: "center", fontSize: 9 },
  });
  y = paragraph(doc, "Note", payment.note, y);
  signature(doc, clinic.branding.signatureLabel, `For ${clinic.name}`, y);
  drawFooters(doc, clinic);
  return doc;
}

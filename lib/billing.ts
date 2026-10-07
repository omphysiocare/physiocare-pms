import type { Invoice, InvoiceItem, InvoiceStatus, InvoiceTotals, Payment } from "@/types";

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function lineAmount(item: Pick<InvoiceItem, "quantity" | "unitPrice">): number {
  return round((item.quantity || 0) * (item.unitPrice || 0));
}

export function calculateSubtotal(items: Pick<InvoiceItem, "quantity" | "unitPrice">[]): number {
  return round(items.reduce((sum, item) => sum + lineAmount(item), 0));
}

/**
 * Discount is applied before tax and spread across lines proportionally, so each
 * line is taxed at its own rate on its discounted value.
 */
export function calculateInvoiceTotals(
  invoice: Pick<Invoice, "items" | "discount"> & { payments?: Pick<Payment, "amount" | "kind">[] },
): InvoiceTotals {
  const subtotal = calculateSubtotal(invoice.items);
  const discount = Math.min(Math.max(invoice.discount || 0, 0), subtotal);
  const factor = subtotal > 0 ? (subtotal - discount) / subtotal : 0;
  const tax = round(invoice.items.reduce((sum, item) => sum + lineAmount(item) * factor * ((item.taxRate || 0) / 100), 0));
  const total = round(subtotal - discount + tax);
  const payments = invoice.payments ?? [];
  const received = payments.filter((p) => p.kind !== "refund").reduce((sum, p) => sum + p.amount, 0);
  const refunded = round(payments.filter((p) => p.kind === "refund").reduce((sum, p) => sum + p.amount, 0));
  const paid = round(received - refunded);
  return { subtotal, discount, tax, total, paid, refunded, balance: Math.max(0, round(total - paid)) };
}

export function deriveInvoiceStatus(cancelled: boolean, totals: Pick<InvoiceTotals, "total" | "paid" | "refunded">): InvoiceStatus {
  if (cancelled) return "Cancelled";
  if (totals.refunded > 0 && totals.paid <= 0) return "Refunded";
  if (totals.paid <= 0) return "Pending";
  if (totals.paid + 0.001 >= totals.total) return "Paid";
  return "Partially Paid";
}

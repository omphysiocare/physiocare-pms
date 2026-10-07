import { http } from "@/lib/api/client";
import { isMockApi } from "@/lib/api/config";
import { ApiError } from "@/lib/api/errors";
import { logActivity } from "@/lib/api/mock/audit";
import { findOrThrow, insertRecord, removeRecord, updateRecord } from "@/lib/api/mock/crud";
import { commit, getDb, nowISO } from "@/lib/api/mock/db";
import { findPatient, invoiceIdByServiceRecord, lastMessageIndex, patientName, toPatientRef, withInvoiceRelations } from "@/lib/api/mock/relations";
import { run } from "@/lib/api/mock/run";
import { getActorId } from "@/lib/api/session";
import { calculateInvoiceTotals } from "@/lib/billing";
import { formatCurrency } from "@/lib/format";
import { ID_PREFIX, nextId } from "@/lib/ids";
import type { CreateInput, Invoice, InvoiceWithRelations, Payment, PaymentInput, PaymentRecord } from "@/types";

import { scopeMatches, type PatientScopedFilters } from "./types";

export type InvoiceInput = Omit<CreateInput<Invoice>, "payments" | "cancelled" | "cancellationReason">;
export type CreateInvoiceInput = InvoiceInput & { initialPayment?: PaymentInput | null };
export interface RefundInput {
  amount: number;
  date: string;
  method: PaymentInput["method"];
  reason: string;
}

export interface BillingService {
  list(filters?: PatientScopedFilters): Promise<InvoiceWithRelations[]>;
  get(id: string): Promise<InvoiceWithRelations>;
  create(input: CreateInvoiceInput): Promise<Invoice>;
  update(id: string, input: InvoiceInput): Promise<Invoice>;
  cancel(id: string, reason: string): Promise<Invoice>;
  remove(id: string): Promise<void>;
}

export interface PaymentService {
  list(filters?: PatientScopedFilters): Promise<PaymentRecord[]>;
  record(invoiceId: string, payment: PaymentInput): Promise<Payment>;
  refund(invoiceId: string, input: RefundInput): Promise<Payment>;
  remove(invoiceId: string, paymentId: string): Promise<void>;
}

const RESOURCE = "Invoice";

function allPayments(): Payment[] {
  return getDb().invoices.flatMap((invoice) => invoice.payments);
}

function nextPaymentNumbers(kind: Payment["kind"]) {
  const payments = allPayments();
  const prefix = kind === "refund" ? ID_PREFIX.creditNote : getDb().clinic.billingSettings.receiptPrefix || ID_PREFIX.receipt;
  return {
    id: nextId(ID_PREFIX.payment, payments.map((p) => p.id)),
    receiptNumber: nextId(prefix, payments.filter((p) => p.receiptNumber.startsWith(`${prefix}-`)).map((p) => p.receiptNumber)),
  };
}

function assertServiceRecordsUnbilled(input: InvoiceInput, ignoreInvoiceId?: string): void {
  const billed = invoiceIdByServiceRecord();
  for (const item of input.items) {
    if (!item.serviceRecordId) continue;
    const existing = billed.get(item.serviceRecordId);
    if (existing && existing !== ignoreInvoiceId) throw new ApiError(`${item.serviceRecordId} is already billed on invoice ${existing}.`, 409);
  }
}

function assertPaymentFits(invoice: Pick<Invoice, "items" | "discount" | "payments" | "cancelled">, amount: number): void {
  if (invoice.cancelled) throw new ApiError("Payments cannot be recorded on a cancelled invoice.", 409);
  if (amount <= 0) throw new ApiError("Payment amount must be greater than zero.", 400);
  const { balance } = calculateInvoiceTotals(invoice);
  if (amount > balance + 0.001) throw new ApiError(`Payment exceeds the outstanding balance of ${formatCurrency(balance)}.`, 400);
}

const mockBillingService: BillingService = {
  list: (filters) =>
    run(() => {
      const messages = lastMessageIndex("invoice");
      return getDb()
        .invoices.filter((item) => scopeMatches(filters, item))
        .sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate) || b.id.localeCompare(a.id))
        .map((invoice) => withInvoiceRelations(invoice, messages));
    }),
  get: (id) => run(() => withInvoiceRelations(findOrThrow(getDb().invoices, id, RESOURCE))),
  create: ({ initialPayment, ...input }) =>
    run(() => {
      const patient = findPatient(input.patientId);
      assertServiceRecordsUnbilled(input);
      if (initialPayment) assertPaymentFits({ ...input, payments: [], cancelled: false }, initialPayment.amount);
      const payments: Payment[] = initialPayment ? [{ ...initialPayment, ...nextPaymentNumbers("payment"), kind: "payment", recordedBy: getActorId() }] : [];
      const invoice = insertRecord<Invoice>(getDb().invoices, ID_PREFIX.invoice, { ...input, payments, cancelled: false, cancellationReason: "" });
      logActivity("created", "Billing", invoice.id, `Created invoice ${invoice.id} for ${patientName(patient)} (${formatCurrency(calculateInvoiceTotals(invoice).total)})`, invoice.branchId);
      if (payments[0]) logActivity("payment", "Billing", invoice.id, `Received ${formatCurrency(payments[0].amount)} via ${payments[0].method} (${payments[0].receiptNumber})`, invoice.branchId);
      return invoice;
    }),
  update: (id, input) =>
    run(() => {
      const invoice = findOrThrow(getDb().invoices, id, RESOURCE);
      if (invoice.cancelled) throw new ApiError("Cancelled invoices cannot be edited.", 409);
      findPatient(input.patientId);
      assertServiceRecordsUnbilled(input, id);
      const totals = calculateInvoiceTotals({ ...input, payments: invoice.payments });
      if (totals.paid > totals.total + 0.001) throw new ApiError("The invoice total cannot be lower than the amount already paid.", 400);
      const updated = updateRecord(getDb().invoices, id, input, RESOURCE);
      logActivity("updated", "Billing", id, `Updated invoice ${id}`, updated.branchId);
      return updated;
    }),
  cancel: (id, reason) =>
    run(() => {
      const invoice = findOrThrow(getDb().invoices, id, RESOURCE);
      if (calculateInvoiceTotals(invoice).paid > 0) throw new ApiError("Refund the payments on this invoice before cancelling it.", 409);
      const updated = updateRecord(getDb().invoices, id, { cancelled: true, cancellationReason: reason }, RESOURCE);
      logActivity("status_changed", "Billing", id, `Cancelled invoice ${id}${reason ? ` (${reason})` : ""}`, updated.branchId);
      return updated;
    }),
  remove: (id) =>
    run(() => {
      const invoice = findOrThrow(getDb().invoices, id, RESOURCE);
      if (invoice.payments.length > 0) throw new ApiError("Invoices with payment history cannot be deleted. Cancel it instead.", 409);
      removeRecord(getDb().invoices, id, RESOURCE);
      logActivity("deleted", "Billing", id, `Deleted invoice ${id}`, invoice.branchId);
    }),
};

const mockPaymentService: PaymentService = {
  list: (filters) =>
    run(() =>
      getDb()
        .invoices.filter((invoice) => scopeMatches(filters, invoice))
        .flatMap((invoice) =>
          invoice.payments.map<PaymentRecord>((payment) => ({
            ...payment,
            invoiceId: invoice.id,
            branchId: invoice.branchId,
            providerId: invoice.providerId,
            patient: toPatientRef(invoice.patientId),
          })),
        )
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
    ),
  record: (invoiceId, input) =>
    run(() => {
      const invoice = findOrThrow(getDb().invoices, invoiceId, RESOURCE);
      assertPaymentFits(invoice, input.amount);
      const payment: Payment = { ...input, ...nextPaymentNumbers("payment"), kind: "payment", recordedBy: getActorId() };
      invoice.payments.push(payment);
      invoice.updatedAt = nowISO();
      commit();
      logActivity("payment", "Billing", invoiceId, `Received ${formatCurrency(payment.amount)} via ${payment.method} on ${invoiceId} (${payment.receiptNumber})`, invoice.branchId);
      return payment;
    }),
  refund: (invoiceId, input) =>
    run(() => {
      const invoice = findOrThrow(getDb().invoices, invoiceId, RESOURCE);
      const { paid } = calculateInvoiceTotals(invoice);
      if (input.amount <= 0) throw new ApiError("Refund amount must be greater than zero.", 400);
      if (input.amount > paid + 0.001) throw new ApiError(`Refund cannot exceed the net amount paid (${formatCurrency(paid)}).`, 400);
      const refund: Payment = {
        ...nextPaymentNumbers("refund"),
        kind: "refund",
        date: input.date,
        amount: input.amount,
        method: input.method,
        reference: "",
        note: input.reason,
        recordedBy: getActorId(),
      };
      invoice.payments.push(refund);
      invoice.updatedAt = nowISO();
      commit();
      logActivity("refund", "Billing", invoiceId, `Refunded ${formatCurrency(refund.amount)} on ${invoiceId} (${refund.receiptNumber}) — ${input.reason}`, invoice.branchId);
      return refund;
    }),
  remove: (invoiceId, paymentId) =>
    run(() => {
      const invoice = findOrThrow(getDb().invoices, invoiceId, RESOURCE);
      const payment = findOrThrow(invoice.payments, paymentId, "Payment");
      invoice.payments = invoice.payments.filter((item) => item.id !== paymentId);
      invoice.updatedAt = nowISO();
      commit();
      logActivity("deleted", "Billing", invoiceId, `Removed ${payment.kind} ${payment.receiptNumber} (${formatCurrency(payment.amount)})`, invoice.branchId);
    }),
};

const httpBillingService: BillingService = {
  list: (filters) => http.get<InvoiceWithRelations[]>("/invoices", filters),
  get: (id) => http.get<InvoiceWithRelations>(`/invoices/${id}`),
  create: (input) => http.post<Invoice>("/invoices", input),
  update: (id, input) => http.put<Invoice>(`/invoices/${id}`, input),
  cancel: (id, reason) => http.post<Invoice>(`/invoices/${id}/cancel`, { reason }),
  remove: (id) => http.delete(`/invoices/${id}`),
};

const httpPaymentService: PaymentService = {
  list: (filters) => http.get<PaymentRecord[]>("/payments", filters),
  record: (invoiceId, payment) => http.post<Payment>(`/invoices/${invoiceId}/payments`, payment),
  refund: (invoiceId, input) => http.post<Payment>(`/invoices/${invoiceId}/refunds`, input),
  remove: (invoiceId, paymentId) => http.delete(`/invoices/${invoiceId}/payments/${paymentId}`),
};

export const billingService = isMockApi ? mockBillingService : httpBillingService;
export const paymentService = isMockApi ? mockPaymentService : httpPaymentService;

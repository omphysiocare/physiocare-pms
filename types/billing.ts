import type { BaseEntity, ISODate, MemberRef, PatientRef, PaymentMethod, TenantScoped } from "./common";
import type { MessageSummary } from "./messaging";

export const INVOICE_STATUSES = ["Paid", "Partially Paid", "Pending", "Refunded", "Cancelled"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export interface InvoiceItem {
  id: string;
  description: string;
  serviceId: string | null;
  serviceRecordId: string | null;
  quantity: number;
  unitPrice: number;
  /** Tax rate in percent for this line. */
  taxRate: number;
}

export interface Payment {
  id: string;
  kind: "payment" | "refund";
  /** Receipt number for payments, credit note number for refunds. */
  receiptNumber: string;
  date: ISODate;
  amount: number;
  method: PaymentMethod;
  reference: string;
  note: string;
  recordedBy: string;
}

export interface Invoice extends BaseEntity, TenantScoped {
  patientId: string;
  appointmentId: string | null;
  providerId: string;
  invoiceDate: ISODate;
  dueDate: ISODate;
  items: InvoiceItem[];
  /** Flat discount applied before tax. */
  discount: number;
  payments: Payment[];
  cancelled: boolean;
  cancellationReason: string;
  notes: string;
}

export interface InvoiceTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  /** Net amount received (payments minus refunds). */
  paid: number;
  refunded: number;
  balance: number;
}

export interface InvoiceWithRelations extends Invoice, InvoiceTotals {
  status: InvoiceStatus;
  patient: PatientRef;
  provider: MemberRef;
  paymentMethod: PaymentMethod | null;
  lastMessage: MessageSummary | null;
}

export type PaymentInput = Omit<Payment, "id" | "kind" | "receiptNumber" | "recordedBy">;

/** Flattened payment for payment lists and reports. */
export interface PaymentRecord extends Payment {
  invoiceId: string;
  branchId: string;
  providerId: string;
  patient: PatientRef;
}

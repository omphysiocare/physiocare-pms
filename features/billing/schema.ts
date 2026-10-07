import dayjs from "dayjs";
import { z } from "zod";

import { calculateInvoiceTotals } from "@/lib/billing";
import { today, toISODate } from "@/lib/dates";
import { definedOnly } from "@/lib/object";
import { isoDate, optionalText, requiredNumber, requiredText, selectOne } from "@/lib/validation";
import type { CreateInvoiceInput, InvoiceInput } from "@/services/billingService";
import { PAYMENT_METHODS, type Invoice } from "@/types";

const itemSchema = z.object({
  id: z.string(),
  description: requiredText("Description", 200),
  serviceId: z.string(),
  serviceRecordId: z.string(),
  quantity: requiredNumber("Qty", { min: 1, max: 1000, integer: true }),
  unitPrice: requiredNumber("Rate", { min: 0, max: 10000000 }),
  taxRate: requiredNumber("Tax", { min: 0, max: 28 }),
});

export const invoiceSchema = z
  .object({
    patientId: z.string().min(1, "Select a patient"),
    providerId: z.string().min(1, "Select a provider"),
    branchId: z.string().min(1, "Select a branch"),
    appointmentId: z.string(),
    invoiceDate: isoDate("Invoice date"),
    dueDate: isoDate("Due date"),
    items: z.array(itemSchema).min(1, "Add at least one line item"),
    discount: requiredNumber("Discount", { min: 0 }),
    notes: optionalText(1000),
    recordPayment: z.boolean(),
    payment: z.object({ amount: z.number().nullable(), method: selectOne(PAYMENT_METHODS, "Payment method"), reference: optionalText(80) }),
  })
  .superRefine((values, ctx) => {
    if (values.dueDate < values.invoiceDate) ctx.addIssue({ code: "custom", path: ["dueDate"], message: "Due date cannot be before the invoice date" });
    const totals = calculateInvoiceTotals(values);
    if (values.discount > totals.subtotal) ctx.addIssue({ code: "custom", path: ["discount"], message: "Discount cannot exceed the subtotal" });
    if (values.recordPayment) {
      const amount = values.payment.amount;
      if (amount === null || amount <= 0) ctx.addIssue({ code: "custom", path: ["payment", "amount"], message: "Enter the amount received" });
      else if (amount > totals.total) ctx.addIssue({ code: "custom", path: ["payment", "amount"], message: "Payment cannot exceed the invoice total" });
    }
  });

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;
export type InvoiceItemFormValues = InvoiceFormValues["items"][number];

let counter = 0;
export function newItem(partial: Partial<InvoiceItemFormValues> = {}): InvoiceItemFormValues {
  counter += 1;
  return { id: `new-${counter}`, description: "", serviceId: "", serviceRecordId: "", quantity: 1, unitPrice: 0, taxRate: 0, ...partial };
}

export function emptyInvoiceValues(defaults: Partial<InvoiceFormValues> & { paymentTermsDays?: number } = {}): InvoiceFormValues {
  const { paymentTermsDays = 7, ...rest } = definedOnly(defaults);
  const invoiceDate = rest.invoiceDate ?? today();
  return {
    patientId: "",
    providerId: "",
    branchId: "",
    appointmentId: "",
    invoiceDate,
    dueDate: toISODate(dayjs(invoiceDate).add(paymentTermsDays, "day")),
    items: [],
    discount: 0,
    notes: "",
    recordPayment: false,
    payment: { amount: null, method: "UPI", reference: "" },
    ...rest,
  };
}

export function invoiceToFormValues(invoice: Invoice): InvoiceFormValues {
  return {
    patientId: invoice.patientId,
    providerId: invoice.providerId,
    branchId: invoice.branchId,
    appointmentId: invoice.appointmentId ?? "",
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    items: invoice.items.map((item) => ({ ...item, serviceId: item.serviceId ?? "", serviceRecordId: item.serviceRecordId ?? "" })),
    discount: invoice.discount,
    notes: invoice.notes,
    recordPayment: false,
    payment: { amount: null, method: "UPI", reference: "" },
  };
}

export function formValuesToInvoiceInput(values: InvoiceFormValues): InvoiceInput {
  return {
    patientId: values.patientId,
    providerId: values.providerId,
    branchId: values.branchId,
    appointmentId: values.appointmentId || null,
    invoiceDate: values.invoiceDate,
    dueDate: values.dueDate,
    items: values.items.map((item, index) => ({ ...item, id: `item-${index + 1}`, serviceId: item.serviceId || null, serviceRecordId: item.serviceRecordId || null })),
    discount: values.discount,
    notes: values.notes,
  };
}

export function formValuesToCreateInvoiceInput(values: InvoiceFormValues): CreateInvoiceInput {
  return {
    ...formValuesToInvoiceInput(values),
    initialPayment:
      values.recordPayment && values.payment.amount
        ? { amount: values.payment.amount, method: values.payment.method, reference: values.payment.reference, date: values.invoiceDate > today() ? today() : values.invoiceDate, note: "Paid at billing" }
        : null,
  };
}

export const paymentSchema = z.object({
  amount: requiredNumber("Amount", { min: 1 }),
  date: isoDate("Payment date").refine((value) => value <= today(), "Payment date cannot be in the future"),
  method: selectOne(PAYMENT_METHODS, "Payment method"),
  reference: optionalText(80),
  note: optionalText(200),
});
export type PaymentFormValues = z.infer<typeof paymentSchema>;

export const refundSchema = z.object({
  amount: requiredNumber("Amount", { min: 1 }),
  date: isoDate("Refund date").refine((value) => value <= today(), "Refund date cannot be in the future"),
  method: selectOne(PAYMENT_METHODS, "Refund method"),
  reason: requiredText("Reason", 200),
});
export type RefundFormValues = z.infer<typeof refundSchema>;

"use client";

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FormTextField } from "@/components/forms";
import { useRecordPayment, useRefundPayment } from "@/hooks/useBilling";
import { today } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import { useNotify } from "@/providers/NotificationProvider";
import { PAYMENT_METHODS, type InvoiceWithRelations } from "@/types";

import { paymentSchema, refundSchema, type PaymentFormValues, type RefundFormValues } from "./schema";

function PaymentForm({ invoice, onClose }: { invoice: InvoiceWithRelations; onClose: () => void }) {
  const notify = useNotify();
  const record = useRecordPayment(invoice.id);
  const { control, handleSubmit, setError, formState } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: invoice.balance, date: today(), method: "UPI", reference: "", note: "" },
  });
  const submit = async (values: PaymentFormValues) => {
    if (values.amount > invoice.balance) return setError("amount", { message: `Cannot exceed the balance of ${formatCurrency(invoice.balance)}` });
    try {
      const payment = await record.mutateAsync(values);
      notify.success(`Payment of ${formatCurrency(values.amount)} recorded (${payment.receiptNumber})`);
      onClose();
    } catch (error) {
      notify.error(error);
    }
  };
  return (
    <form noValidate onSubmit={handleSubmit(submit)}>
      <DialogTitle>Record Payment</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          {invoice.id} · {invoice.patient.name} · Balance due <strong>{formatCurrency(invoice.balance)}</strong>
        </Typography>
        <Stack spacing={2.5}>
          <FormTextField control={control} name="amount" label="Amount (₹)" type="number" required autoFocus />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormTextField control={control} name="date" label="Payment date" type="date" required />
            <FormTextField control={control} name="method" label="Method" required options={PAYMENT_METHODS} />
          </Stack>
          <FormTextField control={control} name="reference" label="Reference / transaction ID" />
          <FormTextField control={control} name="note" label="Note" />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button color="inherit" onClick={onClose} disabled={formState.isSubmitting}>Cancel</Button>
        <Button type="submit" variant="contained" loading={formState.isSubmitting}>Record Payment</Button>
      </DialogActions>
    </form>
  );
}

export function RecordPaymentDialog({ invoice, open, onClose }: { invoice: InvoiceWithRelations; open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {open && <PaymentForm invoice={invoice} onClose={onClose} />}
    </Dialog>
  );
}

function RefundForm({ invoice, onClose }: { invoice: InvoiceWithRelations; onClose: () => void }) {
  const notify = useNotify();
  const refund = useRefundPayment(invoice.id);
  const { control, handleSubmit, setError, formState } = useForm<RefundFormValues>({
    resolver: zodResolver(refundSchema),
    defaultValues: { amount: invoice.paid, date: today(), method: invoice.paymentMethod ?? "Cash", reason: "" },
  });
  const submit = async (values: RefundFormValues) => {
    if (values.amount > invoice.paid) return setError("amount", { message: `Cannot exceed the net paid amount of ${formatCurrency(invoice.paid)}` });
    try {
      const result = await refund.mutateAsync(values);
      notify.success(`Refund of ${formatCurrency(values.amount)} recorded (${result.receiptNumber})`);
      onClose();
    } catch (error) {
      notify.error(error);
    }
  };
  return (
    <form noValidate onSubmit={handleSubmit(submit)}>
      <DialogTitle>Issue Refund</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          {invoice.id} · Net paid <strong>{formatCurrency(invoice.paid)}</strong>. A credit note number will be generated.
        </Typography>
        <Stack spacing={2.5}>
          <FormTextField control={control} name="amount" label="Refund amount (₹)" type="number" required autoFocus />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormTextField control={control} name="date" label="Refund date" type="date" required />
            <FormTextField control={control} name="method" label="Refund method" required options={PAYMENT_METHODS} />
          </Stack>
          <FormTextField control={control} name="reason" label="Reason" required />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button color="inherit" onClick={onClose} disabled={formState.isSubmitting}>Cancel</Button>
        <Button type="submit" variant="contained" color="warning" loading={formState.isSubmitting}>Issue Refund</Button>
      </DialogActions>
    </form>
  );
}

export function RefundDialog({ invoice, open, onClose }: { invoice: InvoiceWithRelations; open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {open && <RefundForm invoice={invoice} onClose={onClose} />}
    </Dialog>
  );
}

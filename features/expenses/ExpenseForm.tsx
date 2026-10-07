"use client";

import { NotesOutlined, PaymentsOutlined, ReceiptOutlined } from "@mui/icons-material";
import { Stack } from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FieldSpan, FormActions, FormSection, FormTextField } from "@/components/forms";
import { useBranches } from "@/hooks/useClinic";
import { useMembers } from "@/hooks/useMembers";
import { EXPENSE_CATEGORIES, EXPENSE_STATUSES, PAYMENT_METHODS } from "@/types";

import { expenseSchema, type ExpenseFormValues } from "./schema";

interface ExpenseFormProps {
  defaultValues: ExpenseFormValues;
  submitLabel: string;
  onSubmit: (values: ExpenseFormValues) => Promise<unknown>;
  onCancel: () => void;
}

export default function ExpenseForm({ defaultValues, submitLabel, onSubmit, onCancel }: ExpenseFormProps) {
  const { data: staff = [] } = useMembers();
  const { data: branches = [] } = useBranches();
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<ExpenseFormValues>({ resolver: zodResolver(expenseSchema), defaultValues, mode: "onTouched" });

  const payers = Array.from(new Set([...staff.map((member) => member.name), "Clinic Petty Cash", defaultValues.paidBy].filter(Boolean)));

  return (
    <Stack component="form" spacing={3} noValidate onSubmit={handleSubmit(onSubmit)}>
      <FormSection title="Expense Details" icon={<ReceiptOutlined />}>
        <FormTextField control={control} name="date" label="Expense date" type="date" required />
        <FormTextField control={control} name="category" label="Category" required options={EXPENSE_CATEGORIES} />
        <FieldSpan>
          <FormTextField control={control} name="description" label="Description" required placeholder="e.g. Kinesio tapes & electrode pads" />
        </FieldSpan>
        <FormTextField control={control} name="vendor" label="Vendor / payee" placeholder="Supplier or person paid" />
        <FormTextField control={control} name="amount" label="Amount (₹)" type="number" required />
      </FormSection>

      <FormSection title="Payment Information" icon={<PaymentsOutlined />}>
        <FormTextField control={control} name="paymentMethod" label="Payment method" required options={PAYMENT_METHODS} />
        <FormTextField control={control} name="paidBy" label="Paid by" required options={payers} />
        <FormTextField control={control} name="reference" label="Reference / bill number" />
        <FormTextField control={control} name="status" label="Status" required options={EXPENSE_STATUSES} />
        <FormTextField control={control} name="branchId" label="Branch" required options={branches.map((b) => ({ value: b.id, label: b.name }))} />
      </FormSection>

      <FormSection title="Notes" icon={<NotesOutlined />} columns={1}>
        <FormTextField control={control} name="notes" label="Notes" multiline minRows={3} />
      </FormSection>

      <FormActions submitting={isSubmitting} submitLabel={submitLabel} onCancel={onCancel} onReset={() => reset(defaultValues)} isDirty={isDirty} />
    </Stack>
  );
}

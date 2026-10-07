"use client";

import { useRouter } from "next/navigation";

import { PageHeader, QueryBoundary } from "@/components/common";
import { useCreateExpense, useExpense, useUpdateExpense } from "@/hooks/useExpenses";
import { useBranches } from "@/hooks/useClinic";
import { useAuth } from "@/providers/AuthProvider";
import { useBranch } from "@/providers/BranchProvider";
import { useNotify } from "@/providers/NotificationProvider";

import ExpenseForm from "./ExpenseForm";
import { emptyExpenseValues, expenseToFormValues, formValuesToExpenseInput, type ExpenseFormValues } from "./schema";

export function ExpenseCreateView() {
  const router = useRouter();
  const notify = useNotify();
  const { member } = useAuth();
  const { branchId } = useBranch();
  const { data: branches = [] } = useBranches();
  const createExpense = useCreateExpense();
  const defaultBranch = branchId !== "all" ? branchId : (branches.find((b) => b.isMain)?.id ?? "");

  const handleSubmit = async (values: ExpenseFormValues) => {
    try {
      const expense = await createExpense.mutateAsync(formValuesToExpenseInput(values));
      notify.success(`Expense ${expense.id} added`);
      router.push(`/expenses/${expense.id}`);
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <>
      <PageHeader title="Add Expense" description="Record a clinic expense." backHref="/expenses" backLabel="Expenses" />
      {branches.length > 0 && member && <ExpenseForm defaultValues={emptyExpenseValues(member.name, defaultBranch)} submitLabel="Save Expense" onSubmit={handleSubmit} onCancel={() => router.push("/expenses")} />}
    </>
  );
}

export function ExpenseEditView({ id }: { id: string }) {
  const router = useRouter();
  const notify = useNotify();
  const query = useExpense(id);
  const updateExpense = useUpdateExpense(id);

  const handleSubmit = async (values: ExpenseFormValues) => {
    try {
      await updateExpense.mutateAsync(formValuesToExpenseInput(values, query.data?.archived));
      notify.success("Expense updated");
      router.push(`/expenses/${id}`);
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <>
      <PageHeader title="Edit Expense" description={id} backHref={`/expenses/${id}`} backLabel="Expense" />
      <QueryBoundary query={query} resource="Expense" backHref="/expenses" loadingVariant="form">
        {(expense) => (
          <ExpenseForm
            defaultValues={expenseToFormValues(expense)}
            submitLabel="Save Changes"
            onSubmit={handleSubmit}
            onCancel={() => router.push(`/expenses/${id}`)}
          />
        )}
      </QueryBoundary>
    </>
  );
}

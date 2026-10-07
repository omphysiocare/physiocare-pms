"use client";

import { ArchiveOutlined, BlockOutlined, CheckCircleOutlined, DeleteOutlined, EditOutlined, ReplayOutlined, UnarchiveOutlined, VisibilityOutlined } from "@mui/icons-material";
import { useRouter } from "next/navigation";

import { useConfirm, type RowAction, type StatusTransition } from "@/components/common";
import { useArchiveExpense, useDeleteExpense, useUpdateExpenseStatus } from "@/hooks/useExpenses";
import { useAuth } from "@/providers/AuthProvider";
import { formatCurrency } from "@/lib/format";
import { useNotify } from "@/providers/NotificationProvider";
import type { Expense, ExpenseStatus } from "@/types";

export function expenseTransitions(status: ExpenseStatus): StatusTransition<ExpenseStatus>[] {
  switch (status) {
    case "Pending":
      return [
        { status: "Paid", label: "Mark as paid", icon: <CheckCircleOutlined />, color: "success", variant: "contained" },
        { status: "Cancelled", label: "Cancel expense", icon: <BlockOutlined />, color: "error" },
      ];
    case "Paid":
      return [{ status: "Pending", label: "Mark as pending", icon: <ReplayOutlined /> }];
    case "Cancelled":
      return [{ status: "Pending", label: "Restore as pending", icon: <ReplayOutlined /> }];
  }
}

export function useExpenseActions({ redirectAfterDelete }: { redirectAfterDelete?: string } = {}) {
  const router = useRouter();
  const notify = useNotify();
  const { confirm, dialog } = useConfirm();
  const updateStatus = useUpdateExpenseStatus();
  const deleteExpense = useDeleteExpense();
  const archiveExpense = useArchiveExpense();
  const { can } = useAuth();

  const toggleArchive = async (expense: Expense) => {
    try {
      await archiveExpense.mutateAsync({ id: expense.id, archived: !expense.archived });
      notify.success(`Expense ${expense.id} ${expense.archived ? "restored" : "archived"}`);
    } catch (error) {
      notify.error(error);
    }
  };

  const changeStatus = async (expense: Expense, status: ExpenseStatus) => {
    if (status === "Cancelled") {
      const ok = await confirm({
        title: "Cancel expense?",
        description: `${expense.id} (${formatCurrency(expense.amount)}) will be excluded from reports.`,
        confirmLabel: "Cancel expense",
        cancelLabel: "Keep",
        destructive: true,
      });
      if (!ok) return;
    }
    try {
      await updateStatus.mutateAsync({ id: expense.id, status });
      notify.success(`Expense ${expense.id} marked as ${status.toLowerCase()}`);
    } catch (error) {
      notify.error(error);
    }
  };

  const remove = async (expense: Expense) => {
    const ok = await confirm({
      title: "Delete expense?",
      description: `${expense.id} — ${expense.description} (${formatCurrency(expense.amount)}) will be permanently deleted.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteExpense.mutateAsync(expense.id);
      notify.success(`Expense ${expense.id} deleted`);
      if (redirectAfterDelete) router.push(redirectAfterDelete);
    } catch (error) {
      notify.error(error);
    }
  };

  const rowActions = (expense: Expense): RowAction[] => [
    { label: "View details", icon: <VisibilityOutlined />, href: `/expenses/${expense.id}` },
    { label: "Edit", icon: <EditOutlined />, href: `/expenses/${expense.id}/edit`, hidden: !can("expenses.edit") },
    ...(can("expenses.edit") ? expenseTransitions(expense.status) : []).map((transition, index) => ({
      label: transition.label,
      icon: transition.icon,
      onClick: () => changeStatus(expense, transition.status),
      destructive: transition.status === "Cancelled",
      divider: index === 0,
    })),
    { label: expense.archived ? "Restore" : "Archive", icon: expense.archived ? <UnarchiveOutlined /> : <ArchiveOutlined />, onClick: () => toggleArchive(expense), divider: true, hidden: !can("expenses.edit") },
    { label: "Delete", icon: <DeleteOutlined />, onClick: () => remove(expense), destructive: true, hidden: !can("expenses.delete") },
  ];

  return { changeStatus, remove, toggleArchive, rowActions, dialog, pending: updateStatus.isPending, can };
}

"use client";

import {
  AccountBalanceWalletOutlined,
  ArchiveOutlined,
  CalendarMonthOutlined,
  CategoryOutlined,
  ContentCopyOutlined,
  DeleteOutlined,
  EditOutlined,
  NotesOutlined,
  PaymentsOutlined,
  PersonOutlined,
  ReceiptOutlined,
} from "@mui/icons-material";
import { Alert, Button, Typography } from "@mui/material";
import Link from "next/link";
import { useMemo } from "react";

import {
  DetailHero,
  DetailLayout,
  DetailList,
  PageHeader,
  QueryBoundary,
  QuickActions,
  SectionCard,
  StatusChip,
  StatusPanel,
  SummaryList,
} from "@/components/common";
import { useExpense, useExpenses } from "@/hooks/useExpenses";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type { Expense } from "@/types";

import { expenseTransitions, useExpenseActions } from "./useExpenseActions";

function ExpenseDetail({ expense }: { expense: Expense }) {
  const { changeStatus, remove, toggleArchive, dialog, pending, can } = useExpenseActions({ redirectAfterDelete: "/expenses" });
  const { data: expenses = [] } = useExpenses(true);

  const categoryStats = useMemo(() => {
    const month = expense.date.slice(0, 7);
    const year = expense.date.slice(0, 4);
    const sameCategory = expenses.filter((item) => item.category === expense.category && item.status !== "Cancelled");
    const sum = (list: Expense[]) => list.reduce((total, item) => total + item.amount, 0);
    return {
      month: sum(sameCategory.filter((item) => item.date.startsWith(month))),
      year: sum(sameCategory.filter((item) => item.date.startsWith(year))),
      count: sameCategory.filter((item) => item.date.startsWith(year)).length,
    };
  }, [expenses, expense]);

  return (
    <>
      <PageHeader
        title="Expense Details"
        description={`${expense.id} · Recorded ${formatDateTime(expense.createdAt)}`}
        backHref="/expenses"
        backLabel="Expenses"
        actions={
          can("expenses.edit") && (
            <Button variant="contained" startIcon={<EditOutlined />} component={Link} href={`/expenses/${expense.id}/edit`}>
              Edit Expense
            </Button>
          )
        }
      />

      {expense.archived && <Alert severity="info" sx={{ mb: 2 }}>This expense is archived and excluded from reports and totals.</Alert>}
      <DetailHero
        icon={<AccountBalanceWalletOutlined />}
        tone="error"
        title={formatCurrency(expense.amount)}
        badges={<StatusChip status={expense.status} />}
        subtitle={expense.description}
        meta={[
          { icon: <CalendarMonthOutlined />, label: "Date", value: formatDate(expense.date) },
          { icon: <CategoryOutlined />, label: "Category", value: expense.category },
          { icon: <PaymentsOutlined />, label: "Payment method", value: expense.paymentMethod },
          { icon: <PersonOutlined />, label: "Paid by", value: expense.paidBy },
        ]}
      />

      <DetailLayout
        main={
          <>
            <SectionCard title="Expense Information" icon={<ReceiptOutlined />}>
              <DetailList
                items={[
                  { label: "Expense ID", value: expense.id },
                  { label: "Date", value: formatDate(expense.date, "ddd, DD MMM YYYY") },
                  { label: "Category", value: expense.category },
                  { label: "Vendor / payee", value: expense.vendor },
                  { label: "Description", value: expense.description, fullWidth: true },
                ]}
              />
            </SectionCard>
            <SectionCard title="Payment Information" icon={<PaymentsOutlined />}>
              <DetailList
                items={[
                  { label: "Amount", value: formatCurrency(expense.amount) },
                  { label: "Payment method", value: expense.paymentMethod },
                  { label: "Paid by", value: expense.paidBy },
                  { label: "Reference / bill no.", value: expense.reference },
                  { label: "Status", value: <StatusChip status={expense.status} /> },
                  { label: "Last updated", value: formatDateTime(expense.updatedAt) },
                ]}
              />
            </SectionCard>
            <SectionCard title="Notes" icon={<NotesOutlined />}>
              <Typography variant="body2" color={expense.notes ? "text.primary" : "text.secondary"} sx={{ whiteSpace: "pre-line" }}>
                {expense.notes || "No notes for this expense."}
              </Typography>
            </SectionCard>
          </>
        }
        aside={
          <>
            <StatusPanel
              status={expense.status}
              transitions={can("expenses.edit") ? expenseTransitions(expense.status) : []}
              onChange={(status) => changeStatus(expense, status)}
              pending={pending}
              rows={[{ label: "Amount", value: formatCurrency(expense.amount) }]}
            />
            <SectionCard title={`${expense.category} Summary`}>
              <SummaryList
                rows={[
                  { label: `In ${formatDate(expense.date, "MMMM")}`, value: formatCurrency(categoryStats.month) },
                  { label: `In ${expense.date.slice(0, 4)}`, value: formatCurrency(categoryStats.year) },
                  { label: "Entries this year", value: categoryStats.count },
                ]}
              />
            </SectionCard>
            <QuickActions
              actions={[
                { label: "Edit expense", icon: <EditOutlined />, href: `/expenses/${expense.id}/edit`, hidden: !can("expenses.edit") },
                { label: "Add similar expense", icon: <ContentCopyOutlined />, href: "/expenses/new", hidden: !can("expenses.create") },
                { label: expense.archived ? "Restore expense" : "Archive expense", icon: <ArchiveOutlined />, onClick: () => toggleArchive(expense), hidden: !can("expenses.edit") },
                { label: "Delete expense", icon: <DeleteOutlined />, onClick: () => remove(expense), destructive: true, hidden: !can("expenses.delete") },
              ]}
            />
          </>
        }
      />
      {dialog}
    </>
  );
}

export default function ExpenseDetailView({ id }: { id: string }) {
  const query = useExpense(id);
  return (
    <QueryBoundary query={query} resource="Expense" backHref="/expenses">
      {(expense) => <ExpenseDetail expense={expense} />}
    </QueryBoundary>
  );
}

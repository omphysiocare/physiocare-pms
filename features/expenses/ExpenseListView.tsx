"use client";

import { Add, AccountBalanceWalletOutlined, CalendarMonthOutlined, PendingActionsOutlined, TrendingUpOutlined } from "@mui/icons-material";
import { Box, Button, Chip, FormControlLabel, Switch, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  DataTable,
  EmptyState,
  ErrorState,
  FilterBar,
  FilterSelect,
  IdLink,
  PageHeader,
  RowActions,
  StatCard,
  StatGrid,
  StatusChip,
  type Column,
} from "@/components/common";
import { useExpenses } from "@/hooks/useExpenses";
import { DATE_FILTERS, isWithin, matchesDateFilter, resolvePeriod, type DateFilter } from "@/lib/dates";
import { formatCurrency, formatDate, percentChange } from "@/lib/format";
import { matchesSearch } from "@/lib/search";
import { EXPENSE_CATEGORIES, EXPENSE_STATUSES, PAYMENT_METHODS, type Expense } from "@/types";

import { useExpenseActions } from "./useExpenseActions";

const ALL = "all";

const columns: Column<Expense>[] = [
  { id: "id", label: "ID", render: (row) => <IdLink id={row.id} href={`/expenses/${row.id}`} />, sortValue: (row) => row.id, hideBelow: "md" },
  { id: "date", label: "Date", render: (row) => <Box sx={{ whiteSpace: "nowrap" }}>{formatDate(row.date)}</Box>, sortValue: (row) => row.date },
  {
    id: "description",
    label: "Description",
    render: (row) => (
      <>
        <Typography variant="body2" sx={{ fontWeight: 500, maxWidth: { xs: 150, sm: 220, lg: 300 } }} noWrap title={row.description}>
          {row.description}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap component="p">
          {row.category}
          {row.vendor ? ` · ${row.vendor}` : ""}
        </Typography>
      </>
    ),
    sortValue: (row) => row.description,
  },
  { id: "category", label: "Category", render: (row) => row.category, sortValue: (row) => row.category, hideBelow: "lg" },
  { id: "method", label: "Payment", render: (row) => row.paymentMethod, sortValue: (row) => row.paymentMethod, hideBelow: "lg" },
  { id: "paidBy", label: "Paid By", render: (row) => row.paidBy, sortValue: (row) => row.paidBy, hideBelow: "xl" },
  { id: "amount", label: "Amount", align: "right", render: (row) => <Box sx={{ fontWeight: 600 }}>{formatCurrency(row.amount)}</Box>, sortValue: (row) => row.amount },
  { id: "status", label: "Status", render: (row) => (row.archived ? <Chip size="small" label="Archived" /> : <StatusChip status={row.status} />), sortValue: (row) => row.status, hideBelow: "sm" },
];

export default function ExpenseListView() {
  const router = useRouter();
  const [showArchived, setShowArchived] = useState(false);
  const { data: expenses = [], isPending, isError, error, refetch } = useExpenses(showArchived);
  const { rowActions, dialog, can } = useExpenseActions();

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [category, setCategory] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const [method, setMethod] = useState<string>(ALL);

  const filtered = useMemo(
    () =>
      expenses.filter(
        (expense) =>
          matchesSearch(search, expense.id, expense.description, expense.vendor, expense.paidBy, expense.reference) &&
          matchesDateFilter(expense.date, dateFilter) &&
          (category === ALL || expense.category === category) &&
          (status === ALL || expense.status === status) &&
          (method === ALL || expense.paymentMethod === method),
      ),
    [expenses, search, dateFilter, category, status, method],
  );

  const stats = useMemo(() => {
    const thisMonth = resolvePeriod("this_month");
    const lastMonth = resolvePeriod("last_month");
    const active = expenses.filter((expense) => expense.status !== "Cancelled" && !expense.archived);
    const sum = (list: Expense[]) => list.reduce((total, expense) => total + expense.amount, 0);
    const monthTotal = sum(active.filter((expense) => isWithin(expense.date, thisMonth)));
    const lastTotal = sum(active.filter((expense) => isWithin(expense.date, lastMonth)));
    const pending = active.filter((expense) => expense.status === "Pending");
    return {
      monthTotal,
      lastTotal,
      change: percentChange(monthTotal, lastTotal),
      pendingAmount: sum(pending),
      pendingCount: pending.length,
      filteredTotal: sum(filtered.filter((expense) => expense.status !== "Cancelled" && !expense.archived)),
    };
  }, [expenses, filtered]);

  const hasFilters = search !== "" || dateFilter !== "all" || category !== ALL || status !== ALL || method !== ALL;
  const resetFilters = () => {
    setSearch("");
    setDateFilter("all");
    setCategory(ALL);
    setStatus(ALL);
    setMethod(ALL);
  };

  return (
    <>
      <PageHeader
        title="Expenses"
        description="Track clinic running costs by category and payment status."
        actions={
          <>
            <FormControlLabel control={<Switch checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />} label="Show archived" />
            {can("expenses.create") && (
              <Button variant="contained" startIcon={<Add />} component={Link} href="/expenses/new">
                Add Expense
              </Button>
            )}
          </>
        }
      />

      <StatGrid>
        <StatCard
          label="This Month"
          value={formatCurrency(stats.monthTotal)}
          icon={<CalendarMonthOutlined />}
          tone="error"
          change={stats.change}
          increaseIsGood={false}
          helper="vs last month"
          loading={isPending}
        />
        <StatCard label="Last Month" value={formatCurrency(stats.lastTotal)} icon={<AccountBalanceWalletOutlined />} tone="neutral" loading={isPending} />
        <StatCard label="Pending Payments" value={formatCurrency(stats.pendingAmount)} icon={<PendingActionsOutlined />} tone="warning" helper={`${stats.pendingCount} bills due`} loading={isPending} />
        <StatCard label="Filtered Total" value={formatCurrency(stats.filteredTotal)} icon={<TrendingUpOutlined />} tone="info" helper={`${filtered.length} expenses shown`} loading={isPending} />
      </StatGrid>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          loading={isPending}
          getRowId={(row) => row.id}
          onRowClick={(row) => router.push(`/expenses/${row.id}`)}
          initialSort={{ columnId: "date", direction: "desc" }}
          resetKey={`${search}|${dateFilter}|${category}|${status}|${method}`}
          toolbar={
            <FilterBar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search by description, vendor, ID or reference"
              hasActiveFilters={hasFilters}
              onReset={resetFilters}
              resultCount={isPending ? undefined : filtered.length}
              totalCount={expenses.length}
            >
              <FilterSelect label="Date" value={dateFilter} onChange={setDateFilter} options={DATE_FILTERS.filter((option) => !["custom", "tomorrow", "upcoming"].includes(option.value))} />
              <FilterSelect label="Category" value={category} onChange={setCategory} options={[{ value: ALL, label: "All categories" }, ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))]} />
              <FilterSelect label="Status" value={status} onChange={setStatus} options={[{ value: ALL, label: "All statuses" }, ...EXPENSE_STATUSES.map((s) => ({ value: s, label: s }))]} />
              <FilterSelect label="Payment" value={method} onChange={setMethod} options={[{ value: ALL, label: "All methods" }, ...PAYMENT_METHODS.map((m) => ({ value: m, label: m }))]} />
            </FilterBar>
          }
          emptyState={
            hasFilters ? (
              <EmptyState title="No expenses match your filters" action={<Button onClick={resetFilters}>Clear filters</Button>} />
            ) : (
              <EmptyState
                title="No expenses recorded"
                icon={<AccountBalanceWalletOutlined />}
                action={
                  <Button variant="contained" startIcon={<Add />} component={Link} href="/expenses/new">
                    Add Expense
                  </Button>
                }
              />
            )
          }
          renderActions={(row) => <RowActions actions={rowActions(row)} />}
        />
      )}
      {dialog}
    </>
  );
}

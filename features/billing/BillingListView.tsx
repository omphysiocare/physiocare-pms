"use client";

import { Add, CurrencyRupee, ErrorOutlined, PaymentsOutlined, PendingActionsOutlined, ReceiptLongOutlined } from "@mui/icons-material";
import { Button, Card, Tab, Tabs } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { DataTable, EmptyState, ErrorState, FilterBar, FilterSelect, PageHeader, RowActions, StatCard, StatGrid } from "@/components/common";
import { useInvoices, usePayments } from "@/hooks/useBilling";
import { useProviders } from "@/hooks/useMembers";
import { DATE_FILTERS, isWithin, matchesDateFilter, resolvePeriod, type DateFilter } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import { matchesSearch } from "@/lib/search";
import { useAuth } from "@/providers/AuthProvider";
import { INVOICE_STATUSES, PAYMENT_METHODS, type InvoiceWithRelations } from "@/types";

import { getInvoiceColumns, getPaymentColumns, isOverdue } from "./columns";
import { RecordPaymentDialog } from "./PaymentDialogs";
import { useInvoiceActions } from "./useInvoiceActions";

const ALL = "all";

export default function BillingListView() {
  const router = useRouter();
  const { can } = useAuth();
  const [tab, setTab] = useState<"invoices" | "payments">("invoices");
  const invoicesQuery = useInvoices();
  const paymentsQuery = usePayments();
  const invoices = useMemo(() => invoicesQuery.data ?? [], [invoicesQuery.data]);
  const payments = useMemo(() => paymentsQuery.data ?? [], [paymentsQuery.data]);
  const { data: providers = [] } = useProviders();
  const [paymentFor, setPaymentFor] = useState<InvoiceWithRelations | null>(null);
  const { rowActions, dialog } = useInvoiceActions({ onRecordPayment: setPaymentFor });

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [status, setStatus] = useState<string>(ALL);
  const [method, setMethod] = useState<string>(ALL);
  const [provider, setProvider] = useState<string>(ALL);
  const [due, setDue] = useState<string>(ALL);

  const filteredInvoices = useMemo(
    () =>
      invoices.filter(
        (invoice) =>
          matchesSearch(search, invoice.id, invoice.patient.name, invoice.patient.id, invoice.patient.phone, ...invoice.items.map((i) => i.description)) &&
          matchesDateFilter(invoice.invoiceDate, dateFilter) &&
          (status === ALL || invoice.status === status) &&
          (method === ALL || invoice.payments.some((p) => p.method === method)) &&
          (provider === ALL || invoice.providerId === provider) &&
          (due === ALL || isOverdue(invoice)),
      ),
    [invoices, search, dateFilter, status, method, provider, due],
  );
  const filteredPayments = useMemo(
    () =>
      payments.filter(
        (p) =>
          matchesSearch(search, p.receiptNumber, p.invoiceId, p.patient.name, p.patient.id, p.reference) &&
          matchesDateFilter(p.date, dateFilter) &&
          (method === ALL || p.method === method) &&
          (provider === ALL || p.providerId === provider),
      ),
    [payments, search, dateFilter, method, provider],
  );

  const stats = useMemo(() => {
    const month = resolvePeriod("this_month");
    const active = invoices.filter((i) => i.status !== "Cancelled");
    return {
      billed: active.filter((i) => isWithin(i.invoiceDate, month)).reduce((s, i) => s + i.total, 0),
      collected: payments.filter((p) => isWithin(p.date, month)).reduce((s, p) => s + (p.kind === "refund" ? -p.amount : p.amount), 0),
      outstanding: active.reduce((s, i) => s + (i.status === "Refunded" ? 0 : i.balance), 0),
      overdue: active.filter(isOverdue).length,
    };
  }, [invoices, payments]);

  const hasFilters = search !== "" || dateFilter !== "all" || [status, method, provider, due].some((v) => v !== ALL);
  const resetFilters = () => {
    setSearch("");
    setDateFilter("all");
    setStatus(ALL);
    setMethod(ALL);
    setProvider(ALL);
    setDue(ALL);
  };
  const isPending = invoicesQuery.isPending || paymentsQuery.isPending;
  const query = tab === "invoices" ? invoicesQuery : paymentsQuery;

  const filters = (
    <FilterBar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder={tab === "invoices" ? "Search invoice, patient, mobile or service" : "Search receipt, invoice, patient or reference"}
      hasActiveFilters={hasFilters}
      onReset={resetFilters}
      resultCount={isPending ? undefined : tab === "invoices" ? filteredInvoices.length : filteredPayments.length}
      totalCount={tab === "invoices" ? invoices.length : payments.length}
    >
      <FilterSelect label="Date" value={dateFilter} onChange={setDateFilter} options={DATE_FILTERS.filter((o) => !["custom", "tomorrow", "upcoming"].includes(o.value))} />
      {tab === "invoices" && <FilterSelect label="Status" value={status} onChange={setStatus} options={[{ value: ALL, label: "All statuses" }, ...INVOICE_STATUSES.map((s) => ({ value: s, label: s }))]} />}
      <FilterSelect label="Payment method" value={method} onChange={setMethod} options={[{ value: ALL, label: "All methods" }, ...PAYMENT_METHODS.map((m) => ({ value: m, label: m }))]} />
      <FilterSelect label="Provider" value={provider} onChange={setProvider} options={[{ value: ALL, label: "All providers" }, ...providers.map((p) => ({ value: p.id, label: p.name }))]} />
      {tab === "invoices" && <FilterSelect label="Due" value={due} onChange={setDue} options={[{ value: ALL, label: "All invoices" }, { value: "overdue", label: "Overdue only" }]} />}
    </FilterBar>
  );

  return (
    <>
      <PageHeader
        title="Billing & Payments"
        description="Invoices, collections, refunds and outstanding balances."
        actions={
          <>
            {can("reports.view") && <Button variant="outlined" component={Link} href="/reports/outstanding">Outstanding report</Button>}
            {can("billing.create") && <Button variant="contained" startIcon={<Add />} component={Link} href="/billing/new">Create Invoice</Button>}
          </>
        }
      />
      <StatGrid>
        <StatCard label="Billed This Month" value={formatCurrency(stats.billed)} icon={<ReceiptLongOutlined />} loading={isPending} />
        <StatCard label="Collected This Month" value={formatCurrency(stats.collected)} icon={<CurrencyRupee />} tone="success" helper="net of refunds" loading={isPending} />
        <StatCard label="Outstanding" value={formatCurrency(stats.outstanding)} icon={<PendingActionsOutlined />} tone="warning" loading={isPending} />
        <StatCard label="Overdue Invoices" value={stats.overdue} icon={<ErrorOutlined />} tone="error" helper="past due date" loading={isPending} />
      </StatGrid>
      <Card sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ px: 1 }}>
          <Tab value="invoices" label={`Invoices (${invoices.length})`} icon={<ReceiptLongOutlined fontSize="small" />} iconPosition="start" />
          <Tab value="payments" label={`Payments & refunds (${payments.length})`} icon={<PaymentsOutlined fontSize="small" />} iconPosition="start" />
        </Tabs>
      </Card>
      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : tab === "invoices" ? (
        <DataTable
          columns={getInvoiceColumns()}
          rows={filteredInvoices}
          loading={isPending}
          getRowId={(row) => row.id}
          onRowClick={(row) => router.push(`/billing/${row.id}`)}
          initialSort={{ columnId: "id", direction: "desc" }}
          resetKey={`i|${search}|${dateFilter}|${status}|${method}|${provider}|${due}`}
          toolbar={filters}
          emptyState={hasFilters ? <EmptyState title="No invoices match your filters" action={<Button onClick={resetFilters}>Clear filters</Button>} /> : <EmptyState title="No invoices yet" icon={<ReceiptLongOutlined />} />}
          renderActions={(row) => <RowActions actions={rowActions(row)} />}
        />
      ) : (
        <DataTable
          columns={getPaymentColumns()}
          rows={filteredPayments}
          loading={isPending}
          getRowId={(row) => row.id}
          onRowClick={(row) => router.push(`/billing/${row.invoiceId}`)}
          initialSort={{ columnId: "date", direction: "desc" }}
          resetKey={`p|${search}|${dateFilter}|${method}|${provider}`}
          toolbar={filters}
          emptyState={<EmptyState title="No payments match your filters" />}
        />
      )}
      {paymentFor && <RecordPaymentDialog invoice={paymentFor} open onClose={() => setPaymentFor(null)} />}
      {dialog}
    </>
  );
}

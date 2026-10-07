"use client";

import { Add, CurrencyRupee, PendingActionsOutlined, SelfImprovementOutlined, TaskAltOutlined } from "@mui/icons-material";
import { Button } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { DataTable, EmptyState, ErrorState, FilterBar, FilterSelect, PageHeader, RowActions, StatCard, StatGrid } from "@/components/common";
import { useCatalog, useTerminology } from "@/hooks/useClinic";
import { useProviders } from "@/hooks/useMembers";
import { useServiceRecords } from "@/hooks/useServiceRecords";
import { DATE_FILTERS, isWithin, matchesDateFilter, resolvePeriod, today, type DateFilter } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import { matchesSearch } from "@/lib/search";
import { useAuth } from "@/providers/AuthProvider";
import { SERVICE_RECORD_STATUSES } from "@/types";

import { getServiceRecordColumns } from "./columns";
import { useServiceRecordActions } from "./useServiceRecordActions";

const ALL = "all";

export default function ServiceRecordListView() {
  const router = useRouter();
  const terms = useTerminology();
  const { can } = useAuth();
  const { data: records = [], isPending, isError, error, refetch } = useServiceRecords();
  const { data: providers = [] } = useProviders();
  const { data: catalog = [] } = useCatalog();
  const { rowActions, dialog } = useServiceRecordActions();

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [status, setStatus] = useState<string>(ALL);
  const [service, setService] = useState<string>(ALL);
  const [category, setCategory] = useState<string>(ALL);
  const [provider, setProvider] = useState<string>(ALL);
  const [billing, setBilling] = useState<string>(ALL);
  const categories = Array.from(new Set(catalog.map((s) => s.category)));

  const filtered = useMemo(
    () =>
      records.filter(
        (item) =>
          matchesSearch(search, item.id, item.patient.name, item.patient.id, item.serviceName, item.area) &&
          matchesDateFilter(item.date, dateFilter) &&
          (status === ALL || item.status === status) &&
          (service === ALL || item.serviceId === service) &&
          (category === ALL || item.service.category === category) &&
          (provider === ALL || item.providerId === provider) &&
          (billing === ALL || (billing === "billed" ? item.invoiceId !== null : item.invoiceId === null && item.status === "Completed")),
      ),
    [records, search, dateFilter, status, service, category, provider, billing],
  );

  const stats = useMemo(() => {
    const month = resolvePeriod("this_month");
    const done = records.filter((item) => item.status === "Completed" && isWithin(item.date, month));
    return {
      today: records.filter((item) => item.date === today() && item.status !== "Cancelled").length,
      completed: done.length,
      value: done.reduce((sum, item) => sum + item.amount, 0),
      unbilled: records.filter((item) => item.status === "Completed" && !item.invoiceId).length,
    };
  }, [records]);

  const hasFilters = search !== "" || dateFilter !== "all" || [status, service, category, provider, billing].some((v) => v !== ALL);
  const resetFilters = () => {
    setSearch("");
    setDateFilter("all");
    setStatus(ALL);
    setService(ALL);
    setCategory(ALL);
    setProvider(ALL);
    setBilling(ALL);
  };

  return (
    <>
      <PageHeader
        title={terms.services}
        description={`Track ${terms.serviceRecords.toLowerCase()}, progress and fees.`}
        actions={
          <>
            {can("clinic.view") && <Button variant="outlined" component={Link} href="/clinic?tab=services">{terms.service} catalog</Button>}
            {can("services.create") && <Button variant="contained" startIcon={<Add />} component={Link} href="/treatments/new">Record {terms.serviceRecord}</Button>}
          </>
        }
      />
      <StatGrid>
        <StatCard label="Today" value={stats.today} icon={<SelfImprovementOutlined />} helper={terms.serviceRecords.toLowerCase()} loading={isPending} />
        <StatCard label="Completed" value={stats.completed} icon={<TaskAltOutlined />} tone="success" helper="this month" loading={isPending} />
        <StatCard label="Service Value" value={formatCurrency(stats.value)} icon={<CurrencyRupee />} tone="secondary" helper="completed this month" loading={isPending} />
        <StatCard label="Awaiting Invoice" value={stats.unbilled} icon={<PendingActionsOutlined />} tone="warning" helper="completed, not invoiced" loading={isPending} />
      </StatGrid>
      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={getServiceRecordColumns(terms)}
          rows={filtered}
          loading={isPending}
          getRowId={(row) => row.id}
          onRowClick={(row) => router.push(`/treatments/${row.id}`)}
          initialSort={{ columnId: "date", direction: "desc" }}
          resetKey={`${search}|${dateFilter}|${status}|${service}|${category}|${provider}|${billing}`}
          toolbar={
            <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder={`Search by patient, ID, ${terms.service.toLowerCase()} or ${terms.area.toLowerCase()}`} hasActiveFilters={hasFilters} onReset={resetFilters} resultCount={isPending ? undefined : filtered.length} totalCount={records.length}>
              <FilterSelect label="Date" value={dateFilter} onChange={setDateFilter} options={DATE_FILTERS.filter((o) => o.value !== "custom")} />
              <FilterSelect label="Status" value={status} onChange={setStatus} options={[{ value: ALL, label: "All statuses" }, ...SERVICE_RECORD_STATUSES.map((s) => ({ value: s, label: s }))]} />
              <FilterSelect label={terms.service} value={service} onChange={setService} options={[{ value: ALL, label: "All" }, ...catalog.map((s) => ({ value: s.id, label: s.name }))]} />
              <FilterSelect label="Category" value={category} onChange={setCategory} options={[{ value: ALL, label: "All categories" }, ...categories.map((c) => ({ value: c, label: c }))]} />
              <FilterSelect label={terms.provider} value={provider} onChange={setProvider} options={[{ value: ALL, label: "All" }, ...providers.map((p) => ({ value: p.id, label: p.name }))]} />
              <FilterSelect label="Billing" value={billing} onChange={setBilling} options={[{ value: ALL, label: "All billing" }, { value: "billed", label: "Invoiced" }, { value: "unbilled", label: "Not invoiced" }]} />
            </FilterBar>
          }
          emptyState={hasFilters ? <EmptyState title="No records match your filters" action={<Button onClick={resetFilters}>Clear filters</Button>} /> : <EmptyState title={`No ${terms.serviceRecords.toLowerCase()} yet`} icon={<SelfImprovementOutlined />} />}
          renderActions={(row) => <RowActions actions={rowActions(row)} />}
        />
      )}
      {dialog}
    </>
  );
}

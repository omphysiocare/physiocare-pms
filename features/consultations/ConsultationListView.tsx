"use client";

import { Add, EventRepeatOutlined, MedicalInformationOutlined, NewReleasesOutlined, TodayOutlined } from "@mui/icons-material";
import { Button } from "@mui/material";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { DataTable, EmptyState, ErrorState, FilterBar, FilterSelect, PageHeader, RowActions, StatCard, StatGrid } from "@/components/common";
import { useTerminology } from "@/hooks/useClinic";
import { useConsultations } from "@/hooks/useConsultations";
import { useProviders } from "@/hooks/useMembers";
import { DATE_FILTERS, isWithin, matchesDateFilter, resolvePeriod, toISODate, today, type DateFilter } from "@/lib/dates";
import { matchesSearch } from "@/lib/search";
import { useAuth } from "@/providers/AuthProvider";
import { VISIT_TYPES } from "@/types";

import { getConsultationColumns } from "./columns";
import { useConsultationActions } from "./useConsultationActions";

const ALL = "all";

export default function ConsultationListView() {
  const router = useRouter();
  const terms = useTerminology();
  const { can } = useAuth();
  const { data: consultations = [], isPending, isError, error, refetch } = useConsultations();
  const { data: providers = [] } = useProviders();
  const { rowActions, dialog } = useConsultationActions();

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [provider, setProvider] = useState<string>(ALL);
  const [visitType, setVisitType] = useState<string>(ALL);

  const filtered = useMemo(
    () =>
      consultations.filter(
        (item) =>
          matchesSearch(search, item.id, item.patient.name, item.patient.id, item.diagnosis, item.chiefComplaint) &&
          matchesDateFilter(item.date, dateFilter) &&
          (provider === ALL || item.providerId === provider) &&
          (visitType === ALL || item.visitType === visitType),
      ),
    [consultations, search, dateFilter, provider, visitType],
  );

  const stats = useMemo(() => {
    const month = resolvePeriod("this_month");
    const thisMonth = consultations.filter((item) => isWithin(item.date, month));
    const nextWeek = { from: today(), to: toISODate(dayjs().add(7, "day")) };
    return {
      total: consultations.length,
      thisMonth: thisMonth.length,
      newThisMonth: thisMonth.filter((c) => c.visitType === "New").length,
      followUps: consultations.filter((item) => item.followUpDate && isWithin(item.followUpDate, nextWeek)).length,
    };
  }, [consultations]);

  const hasFilters = search !== "" || dateFilter !== "all" || provider !== ALL || visitType !== ALL;
  const resetFilters = () => {
    setSearch("");
    setDateFilter("all");
    setProvider(ALL);
    setVisitType(ALL);
  };

  return (
    <>
      <PageHeader
        title={terms.consultations}
        description="Clinical assessments, diagnoses, prescriptions and plans of care."
        actions={can("consultations.create") && <Button variant="contained" startIcon={<Add />} component={Link} href="/consultations/new">New {terms.consultation}</Button>}
      />
      <StatGrid>
        <StatCard label={`Total ${terms.consultations}`} value={stats.total} icon={<MedicalInformationOutlined />} loading={isPending} />
        <StatCard label="This Month" value={stats.thisMonth} icon={<TodayOutlined />} tone="secondary" loading={isPending} />
        <StatCard label="New Visits" value={stats.newThisMonth} icon={<NewReleasesOutlined />} tone="info" helper="this month" loading={isPending} />
        <StatCard label="Follow-ups Due" value={stats.followUps} icon={<EventRepeatOutlined />} tone="warning" helper="next 7 days" loading={isPending} />
      </StatGrid>
      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={getConsultationColumns()}
          rows={filtered}
          loading={isPending}
          getRowId={(row) => row.id}
          onRowClick={(row) => router.push(`/consultations/${row.id}`)}
          initialSort={{ columnId: "date", direction: "desc" }}
          resetKey={`${search}|${dateFilter}|${provider}|${visitType}`}
          toolbar={
            <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search by patient, ID, diagnosis or complaint" hasActiveFilters={hasFilters} onReset={resetFilters} resultCount={isPending ? undefined : filtered.length} totalCount={consultations.length}>
              <FilterSelect label="Date" value={dateFilter} onChange={setDateFilter} options={DATE_FILTERS.filter((o) => o.value !== "custom")} />
              <FilterSelect label="Provider" value={provider} onChange={setProvider} options={[{ value: ALL, label: "All providers" }, ...providers.map((p) => ({ value: p.id, label: p.name }))]} />
              <FilterSelect label="Visit type" value={visitType} onChange={setVisitType} options={[{ value: ALL, label: "All visits" }, ...VISIT_TYPES.map((v) => ({ value: v, label: v }))]} />
            </FilterBar>
          }
          emptyState={hasFilters ? <EmptyState title={`No ${terms.consultations.toLowerCase()} match your filters`} action={<Button onClick={resetFilters}>Clear filters</Button>} /> : <EmptyState title={`No ${terms.consultations.toLowerCase()} yet`} icon={<MedicalInformationOutlined />} />}
          renderActions={(row) => <RowActions actions={rowActions(row)} />}
        />
      )}
      {dialog}
    </>
  );
}

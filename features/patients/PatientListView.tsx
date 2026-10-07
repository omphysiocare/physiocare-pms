"use client";

import {
  Add,
  CalendarMonthOutlined,
  DeleteOutlined,
  EditOutlined,
  HowToRegOutlined,
  PeopleAltOutlined,
  PersonAddAltOutlined,
  PersonOffOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  DataTable,
  EmptyState,
  ErrorState,
  FilterBar,
  FilterSelect,
  PageHeader,
  PatientCell,
  RowActions,
  StatCard,
  StatGrid,
  StatusChip,
  type Column,
} from "@/components/common";
import { usePatients } from "@/hooks/usePatients";
import { useProviders } from "@/hooks/useMembers";
import { useAuth } from "@/providers/AuthProvider";
import { isWithin, resolvePeriod } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { matchesSearch } from "@/lib/search";
import { GENDERS, PATIENT_STATUSES, REFERRAL_SOURCES, type PatientListItem } from "@/types";

import { usePatientActions } from "./usePatientActions";

const ALL = "all";

export default function PatientListView() {
  const router = useRouter();
  const { data: patients = [], isPending, isError, error, refetch } = usePatients();
  const { data: providers = [] } = useProviders();
  const { can } = useAuth();
  const { remove, setStatus, dialog } = usePatientActions();

  const [search, setSearch] = useState("");
  const [status, setStatusFilter] = useState<string>(ALL);
  const [gender, setGender] = useState<string>(ALL);
  const [provider, setProvider] = useState<string>(ALL);
  const [referral, setReferral] = useState<string>(ALL);

  const filtered = useMemo(
    () =>
      patients.filter(
        (patient) =>
          matchesSearch(search, patient.id, patient.name, patient.phone, patient.alternatePhone, patient.email, patient.medical.primaryCondition) &&
          (status === ALL || patient.status === status) &&
          (gender === ALL || patient.gender === gender) &&
          (provider === ALL || patient.primaryProviderId === provider) &&
          (referral === ALL || patient.referral.source === referral),
      ),
    [patients, search, status, gender, provider, referral],
  );

  const stats = useMemo(() => {
    const month = resolvePeriod("this_month");
    return {
      total: patients.length,
      active: patients.filter((patient) => patient.status === "Active").length,
      newThisMonth: patients.filter((patient) => isWithin(patient.registeredOn, month)).length,
      discharged: patients.filter((patient) => patient.status === "Discharged").length,
    };
  }, [patients]);

  const hasFilters = search !== "" || status !== ALL || gender !== ALL || provider !== ALL || referral !== ALL;
  const resetFilters = () => {
    setSearch("");
    setStatusFilter(ALL);
    setGender(ALL);
    setProvider(ALL);
    setReferral(ALL);
  };

  const columns: Column<PatientListItem>[] = [
    { id: "patient", label: "Patient", render: (row) => <PatientCell patient={row} />, sortValue: (row) => row.name },
    { id: "phone", label: "Mobile", render: (row) => <Box sx={{ whiteSpace: "nowrap" }}>{row.phone}</Box>, hideBelow: "md" },
    {
      id: "gender",
      label: "Gender / Age",
      render: (row) => `${row.gender}, ${row.age} yrs`,
      sortValue: (row) => row.age,
      hideBelow: "lg",
    },
    {
      id: "diagnosis",
      label: "Condition",
      render: (row) => (
        <Typography variant="body2" sx={{ maxWidth: { xs: 150, sm: 220, lg: 260 } }} noWrap title={row.medical.primaryCondition}>
          {row.medical.primaryCondition || "—"}
        </Typography>
      ),
      sortValue: (row) => row.medical.primaryCondition,
      hideBelow: "md",
    },
    {
      id: "lastVisit",
      label: "Last Visit",
      render: (row) => formatDate(row.lastVisit),
      sortValue: (row) => row.lastVisit,
      hideBelow: "sm",
    },
    { id: "branch", label: "Branch", render: (row) => row.branchName, sortValue: (row) => row.branchName, hideBelow: "xl" },
    { id: "status", label: "Status", render: (row) => <StatusChip status={row.status} />, sortValue: (row) => row.status },
  ];

  return (
    <>
      <PageHeader
        title="Patients"
        description="Manage patient records, medical history and treatment progress."
        actions={
          can("patients.create") && (
            <Button variant="contained" startIcon={<Add />} component={Link} href="/patients/new">
              Add Patient
            </Button>
          )
        }
      />

      <StatGrid>
        <StatCard label="Total Patients" value={stats.total} icon={<PeopleAltOutlined />} loading={isPending} />
        <StatCard label="Active Patients" value={stats.active} icon={<HowToRegOutlined />} tone="success" helper="currently under treatment" loading={isPending} />
        <StatCard label="New This Month" value={stats.newThisMonth} icon={<PersonAddAltOutlined />} tone="secondary" loading={isPending} />
        <StatCard label="Discharged" value={stats.discharged} icon={<PersonOffOutlined />} tone="info" helper="completed treatment" loading={isPending} />
      </StatGrid>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          loading={isPending}
          getRowId={(row) => row.id}
          onRowClick={(row) => router.push(`/patients/${row.id}`)}
          resetKey={`${search}|${status}|${gender}|${provider}|${referral}`}
          toolbar={
            <FilterBar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search by name, ID, mobile or condition"
              hasActiveFilters={hasFilters}
              onReset={resetFilters}
              resultCount={isPending ? undefined : filtered.length}
              totalCount={patients.length}
            >
              <FilterSelect label="Status" value={status} onChange={setStatusFilter} options={[{ value: ALL, label: "All statuses" }, ...PATIENT_STATUSES.map((s) => ({ value: s, label: s }))]} />
              <FilterSelect label="Gender" value={gender} onChange={setGender} options={[{ value: ALL, label: "All genders" }, ...GENDERS.map((g) => ({ value: g, label: g }))]} />
              <FilterSelect
                label="Provider"
                value={provider}
                onChange={setProvider}
                options={[{ value: ALL, label: "All providers" }, ...providers.map((t) => ({ value: t.id, label: t.name }))]}
              />
              <FilterSelect label="Referral" value={referral} onChange={setReferral} options={[{ value: ALL, label: "All sources" }, ...REFERRAL_SOURCES.map((r) => ({ value: r, label: r }))]} />
            </FilterBar>
          }
          emptyState={
            hasFilters ? (
              <EmptyState
                title="No patients match your filters"
                description="Try a different search term or clear the filters."
                action={<Button onClick={resetFilters}>Clear filters</Button>}
              />
            ) : (
              <EmptyState
                title="No patients yet"
                description="Register your first patient to get started."
                icon={<PeopleAltOutlined />}
                action={
                  <Button variant="contained" startIcon={<Add />} component={Link} href="/patients/new">
                    Add Patient
                  </Button>
                }
              />
            )
          }
          renderActions={(row) => (
            <RowActions
              actions={[
                { label: "View profile", icon: <VisibilityOutlined />, href: `/patients/${row.id}` },
                { label: "Edit", icon: <EditOutlined />, href: `/patients/${row.id}/edit`, hidden: !can("patients.edit") },
                { label: "Book appointment", icon: <CalendarMonthOutlined />, href: `/appointments/new?patientId=${row.id}`, hidden: !can("appointments.create") },
                {
                  hidden: !can("patients.edit"),
                  label: row.status === "Active" ? "Mark inactive" : "Mark active",
                  icon: row.status === "Active" ? <PersonOffOutlined /> : <HowToRegOutlined />,
                  onClick: () => setStatus(row, row.status === "Active" ? "Inactive" : "Active"),
                  divider: true,
                },
                { label: "Delete", icon: <DeleteOutlined />, onClick: () => remove(row), destructive: true, hidden: !can("patients.delete") },
              ]}
            />
          )}
        />
      )}
      {dialog}
    </>
  );
}

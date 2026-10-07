"use client";

import {
  Add,
  CalendarMonthOutlined,
  CalendarViewDayOutlined,
  CalendarViewMonthOutlined,
  CalendarViewWeekOutlined,
  CancelOutlined,
  ChevronLeft,
  ChevronRight,
  EventAvailableOutlined,
  EventBusyOutlined,
  TaskAltOutlined,
  ViewListOutlined,
} from "@mui/icons-material";
import { Box, Button, Card, IconButton, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { DataTable, EmptyState, ErrorState, FilterBar, FilterSelect, LoadingState, PageHeader, RowActions, StatCard, StatGrid } from "@/components/common";
import { useAppointments } from "@/hooks/useAppointments";
import { useCatalog, useClinic } from "@/hooks/useClinic";
import { useMembers, useProviders } from "@/hooks/useMembers";
import { DATE_FILTERS, isWithin, matchesDateFilter, resolvePeriod, toISODate, today, type DateFilter } from "@/lib/dates";
import { matchesSearch } from "@/lib/search";
import { appointmentTypesFor } from "@/lib/specialties";
import { useAuth } from "@/providers/AuthProvider";
import { APPOINTMENT_STATUSES, type AppointmentWithRelations } from "@/types";

import MonthView from "./calendar/MonthView";
import TimeGrid, { type GridColumn } from "./calendar/TimeGrid";
import { getAppointmentColumns } from "./columns";
import { useAppointmentActions } from "./useAppointmentActions";

export type CalendarMode = "list" | "day" | "week" | "month";
const ALL = "all";

function weekStart(date: string) {
  const d = dayjs(date);
  return d.subtract((d.day() + 6) % 7, "day");
}

export default function AppointmentListView({ initialView = "list" }: { initialView?: CalendarMode }) {
  const router = useRouter();
  const { can } = useAuth();
  const { data: appointments = [], isPending, isError, error, refetch } = useAppointments();
  const { data: providers = [] } = useProviders(true);
  const { data: members = [] } = useMembers();
  const { data: catalog = [] } = useCatalog();
  const { data: clinic } = useClinic();
  const { rowActions, dialogs } = useAppointmentActions();

  const [view, setView] = useState<CalendarMode>(initialView);
  const [anchor, setAnchor] = useState(today());
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [specificDate, setSpecificDate] = useState(today());
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [status, setStatus] = useState<string>(ALL);
  const [type, setType] = useState<string>(ALL);
  const [provider, setProvider] = useState<string>(ALL);
  const [service, setService] = useState<string>(ALL);
  const [location, setLocation] = useState<string>(ALL);

  const locations = useMemo(() => Array.from(new Set(appointments.map((a) => a.location).filter(Boolean))).sort(), [appointments]);
  const types = useMemo(() => Array.from(new Set([...appointmentTypesFor(clinic?.specialties ?? []), ...appointments.map((a) => a.type)])), [appointments, clinic]);

  const filtered = useMemo(
    () =>
      appointments.filter(
        (item) =>
          matchesSearch(search, item.id, item.patient.name, item.patient.id, item.patient.phone, item.reason) &&
          (status === ALL || item.status === status) &&
          (type === ALL || item.type === type) &&
          (provider === ALL || item.providerId === provider) &&
          (service === ALL || item.serviceId === service) &&
          (location === ALL || item.location === location),
      ),
    [appointments, search, status, type, provider, service, location],
  );

  const listRows = useMemo(
    () =>
      filtered.filter(
        (item) =>
          matchesDateFilter(item.date, dateFilter, specificDate) && (!rangeFrom || item.date >= rangeFrom) && (!rangeTo || item.date <= rangeTo),
      ),
    [filtered, dateFilter, specificDate, rangeFrom, rangeTo],
  );

  const stats = useMemo(() => {
    const month = resolvePeriod("this_month");
    const week = { from: today(), to: toISODate(dayjs().add(7, "day")) };
    return {
      today: appointments.filter((a) => a.date === today() && a.status !== "Cancelled").length,
      upcoming: appointments.filter((a) => ["Scheduled", "Confirmed", "Rescheduled"].includes(a.status) && isWithin(a.date, week)).length,
      completed: appointments.filter((a) => a.status === "Completed" && isWithin(a.date, month)).length,
      cancelled: appointments.filter((a) => a.status === "Cancelled" && isWithin(a.date, month)).length,
      noShow: appointments.filter((a) => a.status === "No Show" && isWithin(a.date, month)).length,
    };
  }, [appointments]);

  const hasFilters = search !== "" || dateFilter !== "all" || status !== ALL || type !== ALL || provider !== ALL || service !== ALL || location !== ALL || !!rangeFrom || !!rangeTo;
  const resetFilters = () => {
    setSearch("");
    setDateFilter("all");
    setRangeFrom("");
    setRangeTo("");
    setStatus(ALL);
    setType(ALL);
    setProvider(ALL);
    setService(ALL);
    setLocation(ALL);
  };

  const hours = useMemo(() => {
    const open = clinic?.workingHours.filter((d) => d.open) ?? [];
    const start = Math.min(...open.map((d) => Number(d.start.slice(0, 2))), 9);
    const end = Math.max(...open.map((d) => Math.ceil(Number(d.end.slice(0, 2)) + Number(d.end.slice(3)) / 60)), 18);
    return { start, end };
  }, [clinic]);
  const providerColors = Object.fromEntries(members.map((m) => [m.id, m.color]));

  const step = (direction: 1 | -1) => {
    const unit = view === "month" ? "month" : view === "week" ? "week" : "day";
    setAnchor(toISODate(dayjs(anchor).add(direction, unit)));
  };

  const calendarLabel =
    view === "day"
      ? dayjs(anchor).format("dddd, DD MMMM YYYY")
      : view === "week"
        ? `${weekStart(anchor).format("DD MMM")} – ${weekStart(anchor).add(6, "day").format("DD MMM YYYY")}`
        : dayjs(anchor).format("MMMM YYYY");

  const dayColumns: GridColumn[] = useMemo(() => {
    const ofDay = filtered.filter((a) => a.date === anchor);
    const ids = new Set([...providers.map((p) => p.id), ...ofDay.map((a) => a.providerId)]);
    const columnProviders = (provider === ALL ? [...ids] : [provider]).map((id) => members.find((m) => m.id === id)).filter(Boolean);
    return columnProviders.map((m) => ({ key: m!.id, label: m!.name, sublabel: m!.designation, date: anchor, providerId: m!.id, appointments: ofDay.filter((a) => a.providerId === m!.id) }));
  }, [filtered, anchor, providers, members, provider]);

  const weekColumns: GridColumn[] = useMemo(() => {
    const start = weekStart(anchor);
    return Array.from({ length: 7 }, (_, index) => {
      const date = start.add(index, "day");
      const iso = toISODate(date);
      return { key: iso, label: date.format("ddd DD"), sublabel: date.format("MMM"), date: iso, providerId: provider === ALL ? undefined : provider, appointments: filtered.filter((a) => a.date === iso), highlight: iso === today() };
    });
  }, [filtered, anchor, provider]);

  const filterBar = (
    <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search patient, ID, mobile or reason" hasActiveFilters={hasFilters} onReset={resetFilters} resultCount={isPending ? undefined : view === "list" ? listRows.length : undefined} totalCount={view === "list" ? appointments.length : undefined}>
      {view === "list" && <FilterSelect label="Date" value={dateFilter} onChange={setDateFilter} options={DATE_FILTERS} />}
      {view === "list" && dateFilter === "custom" && <TextField type="date" label="On date" value={specificDate} onChange={(e) => setSpecificDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />}
      {view === "list" && <TextField type="date" label="From" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />}
      {view === "list" && <TextField type="date" label="To" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: rangeFrom || undefined } }} />}
      <FilterSelect label="Status" value={status} onChange={setStatus} options={[{ value: ALL, label: "All statuses" }, ...APPOINTMENT_STATUSES.map((s) => ({ value: s, label: s }))]} />
      <FilterSelect label="Provider" value={provider} onChange={setProvider} options={[{ value: ALL, label: "All providers" }, ...providers.map((p) => ({ value: p.id, label: p.name }))]} />
      <FilterSelect label="Type" value={type} onChange={setType} options={[{ value: ALL, label: "All types" }, ...types.map((t) => ({ value: t, label: t }))]} />
      <FilterSelect label="Service" value={service} onChange={setService} options={[{ value: ALL, label: "All services" }, ...catalog.map((s) => ({ value: s.id, label: s.name }))]} />
      <FilterSelect label="Location" value={location} onChange={setLocation} options={[{ value: ALL, label: "All rooms" }, ...locations.map((l) => ({ value: l, label: l }))]} />
    </FilterBar>
  );

  return (
    <>
      <PageHeader
        title="Appointments"
        description="Schedule, check in and track patient visits."
        actions={
          can("appointments.create") && (
            <Button variant="contained" startIcon={<Add />} component={Link} href="/appointments/new">
              Book Appointment
            </Button>
          )
        }
      />

      <StatGrid columns={6}>
        <StatCard label="Today" value={stats.today} icon={<CalendarMonthOutlined />} helper="appointments" loading={isPending} />
        <StatCard label="Next 7 Days" value={stats.upcoming} icon={<EventAvailableOutlined />} tone="secondary" helper="upcoming" loading={isPending} />
        <StatCard label="Completed" value={stats.completed} icon={<TaskAltOutlined />} tone="success" helper="this month" loading={isPending} />
        <StatCard label="Cancelled" value={stats.cancelled} icon={<CancelOutlined />} tone="error" helper="this month" loading={isPending} />
        <StatCard label="No Shows" value={stats.noShow} icon={<EventBusyOutlined />} tone="warning" helper="this month" loading={isPending} />
        <StatCard label="Total Booked" value={appointments.length} icon={<ViewListOutlined />} tone="info" helper="in this branch scope" loading={isPending} />
      </StatGrid>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
        <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, next: CalendarMode | null) => next && setView(next)} aria-label="Calendar view">
          <ToggleButton value="list"><ViewListOutlined fontSize="small" sx={{ mr: 0.75 }} />List</ToggleButton>
          <ToggleButton value="day"><CalendarViewDayOutlined fontSize="small" sx={{ mr: 0.75 }} />Day</ToggleButton>
          <ToggleButton value="week"><CalendarViewWeekOutlined fontSize="small" sx={{ mr: 0.75 }} />Week</ToggleButton>
          <ToggleButton value="month"><CalendarViewMonthOutlined fontSize="small" sx={{ mr: 0.75 }} />Month</ToggleButton>
        </ToggleButtonGroup>
        {view !== "list" && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
            <Tooltip title="Previous"><IconButton onClick={() => step(-1)} aria-label="Previous"><ChevronLeft /></IconButton></Tooltip>
            <Button size="small" variant="outlined" onClick={() => setAnchor(today())}>Today</Button>
            <Tooltip title="Next"><IconButton onClick={() => step(1)} aria-label="Next"><ChevronRight /></IconButton></Tooltip>
            <Typography variant="subtitle1" sx={{ mx: 1 }}>{calendarLabel}</Typography>
            <TextField type="date" value={anchor} onChange={(e) => e.target.value && setAnchor(e.target.value)} fullWidth={false} sx={{ width: 160 }} slotProps={{ htmlInput: { "aria-label": "Go to date" } }} />
          </Box>
        )}
      </Box>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : view === "list" ? (
        <DataTable
          columns={getAppointmentColumns()}
          rows={listRows}
          loading={isPending}
          getRowId={(row: AppointmentWithRelations) => row.id}
          onRowClick={(row) => router.push(`/appointments/${row.id}`)}
          initialSort={{ columnId: "date", direction: "desc" }}
          resetKey={`${search}|${dateFilter}|${specificDate}|${status}|${type}|${provider}|${service}|${location}|${rangeFrom}|${rangeTo}`}
          toolbar={filterBar}
          emptyState={
            hasFilters ? (
              <EmptyState title="No appointments match your filters" description="Try another date range or clear the filters." action={<Button onClick={resetFilters}>Clear filters</Button>} />
            ) : (
              <EmptyState title="No appointments yet" icon={<CalendarMonthOutlined />} />
            )
          }
          renderActions={(row) => <RowActions actions={rowActions(row)} />}
        />
      ) : isPending ? (
        <LoadingState variant="list" />
      ) : (
        <Card>
          {filterBar}
          {view === "month" && <MonthView anchor={anchor} appointments={filtered.filter((a) => a.date.slice(0, 7) === anchor.slice(0, 7) || Math.abs(dayjs(a.date).diff(dayjs(anchor), "day")) < 45)} onOpenDay={(date) => { setAnchor(date); setView("day"); }} />}
          {view === "week" && <TimeGrid columns={weekColumns} startHour={hours.start} endHour={hours.end} providerColors={providerColors} canCreate={can("appointments.create")} />}
          {view === "day" &&
            (dayColumns.length === 0 ? (
              <EmptyState title="No providers in this branch" />
            ) : (
              <TimeGrid columns={dayColumns} startHour={hours.start} endHour={hours.end} providerColors={providerColors} canCreate={can("appointments.create")} />
            ))}
          {(view === "day" || view === "week") && (
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", p: 1.5, borderTop: 1, borderColor: "divider" }}>
              {providers.map((p) => (
                <Box key={p.id} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: "3px", bgcolor: p.color }} />
                  <Typography variant="caption">{p.name}</Typography>
                </Box>
              ))}
              {can("appointments.create") && <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>Click an empty slot to book</Typography>}
            </Box>
          )}
        </Card>
      )}
      {dialogs}
    </>
  );
}

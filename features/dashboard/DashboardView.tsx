"use client";

import {
  AccountBalanceWalletOutlined,
  Add,
  CalendarMonthOutlined,
  CurrencyRupee,
  EventAvailableOutlined,
  EventBusyOutlined,
  EventRepeatOutlined,
  MedicalServicesOutlined,
  PeopleAltOutlined,
  PendingActionsOutlined,
  PersonAddAltOutlined,
  SavingsOutlined,
  TaskAltOutlined,
  TodayOutlined,
  UpcomingOutlined,
} from "@mui/icons-material";
import { Box, Button, List, Typography } from "@mui/material";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { BreakdownBars, TrendChart } from "@/components/charts";
import { DataTable, EmptyState, ErrorState, IdLink, PageHeader, PatientCell, SectionCard, StatCard, StatGrid, StatusChip, type Column } from "@/components/common";
import AppointmentListItem from "@/features/appointments/AppointmentListItem";
import { useBranches, useTerminology } from "@/hooks/useClinic";
import { useDashboardSummary } from "@/hooks/useInsights";
import { formatCurrency, formatCurrencyCompact, formatDate, formatRelativeTime, percentChange } from "@/lib/format";
import { useAuth } from "@/providers/AuthProvider";
import { useBranch } from "@/providers/BranchProvider";
import { chartColors } from "@/theme/theme";
import type { PatientListItem, PaymentRecord } from "@/types";

function greeting(): string {
  const hour = dayjs().hour();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

function Grid({ columns = "1fr 1fr", children }: { columns?: string; children: React.ReactNode }) {
  return <Box sx={{ display: "grid", gap: 3, mb: 3, gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: columns } }}>{children}</Box>;
}

function PaymentRow({ payment }: { payment: PaymentRecord }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.25, borderBottom: 1, borderColor: "divider", "&:last-child": { borderBottom: 0 } }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <PatientCell patient={payment.patient} secondary={`${payment.method} · ${formatDate(payment.date)}`} />
      </Box>
      <Box sx={{ textAlign: "right" }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>+{formatCurrency(payment.amount)}</Typography>
        <IdLink id={payment.invoiceId} href={`/billing/${payment.invoiceId}`} />
      </Box>
    </Box>
  );
}

export default function DashboardView() {
  const router = useRouter();
  const { member, can } = useAuth();
  const terms = useTerminology();
  const { branchId } = useBranch();
  const { data: branches = [] } = useBranches();
  const { data, isPending, isError, error, refetch } = useDashboardSummary();
  const firstName = (member?.name ?? "").replace(/^Dr\.?\s+/, "").split(" ")[0];
  const scope = branchId === "all" ? "all branches" : (branches.find((b) => b.id === branchId)?.name ?? "");

  const patientColumns: Column<PatientListItem>[] = [
    { id: "patient", label: "Patient", render: (row) => <PatientCell patient={row} /> },
    { id: "condition", label: "Condition", render: (row) => <Typography variant="body2" noWrap sx={{ maxWidth: 200 }} title={row.medical.primaryCondition}>{row.medical.primaryCondition || "—"}</Typography>, hideBelow: "xl" },
    { id: "registered", label: "Registered", render: (row) => formatDate(row.registeredOn), hideBelow: "sm" },
    { id: "provider", label: terms.provider, render: (row) => row.primaryProviderName, hideBelow: "xl" },
    { id: "status", label: "Status", render: (row) => <StatusChip status={row.status} /> },
  ];

  return (
    <>
      <PageHeader
        title={`${greeting()}${firstName ? `, ${member?.name.startsWith("Dr") ? "Dr. " : ""}${firstName}` : ""}`}
        description={`${dayjs().format("dddd, DD MMMM YYYY")} · Showing ${scope}`}
        actions={
          <>
            {can("patients.create") && <Button variant="outlined" startIcon={<Add />} component={Link} href="/patients/new">Add Patient</Button>}
            {can("appointments.create") && <Button variant="contained" startIcon={<CalendarMonthOutlined />} component={Link} href="/appointments/new">Book Appointment</Button>}
          </>
        }
      />

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <>
          <Typography variant="overline" color="text.secondary">Patients & appointments</Typography>
          <StatGrid columns={6}>
            <StatCard label="Total Patients" value={data?.patients.total.toLocaleString("en-IN")} icon={<PeopleAltOutlined />} helper={data ? `${data.patients.active} active` : undefined} loading={isPending} />
            <StatCard label="New Patients" value={data?.patients.newThisMonth} icon={<PersonAddAltOutlined />} tone="secondary" change={data && percentChange(data.patients.newThisMonth, data.patients.newPrevious)} helper="this month" loading={isPending} />
            <StatCard label="Today's Appointments" value={data?.appointments.today} icon={<TodayOutlined />} tone="primary" loading={isPending} />
            <StatCard label="Upcoming (7 days)" value={data?.appointments.upcoming} icon={<UpcomingOutlined />} tone="info" loading={isPending} />
            <StatCard label="Completed" value={data?.appointments.completedThisMonth} icon={<TaskAltOutlined />} tone="success" helper="this month" loading={isPending} />
            <StatCard label="Cancelled / No Show" value={data ? `${data.appointments.cancelledThisMonth} / ${data.appointments.noShowThisMonth}` : undefined} icon={<EventBusyOutlined />} tone="error" helper="this month" loading={isPending} />
          </StatGrid>
          <Typography variant="overline" color="text.secondary">Finance & care</Typography>
          <StatGrid columns={6}>
            <StatCard label="Today's Revenue" value={data && formatCurrency(data.todayRevenue)} icon={<CurrencyRupee />} tone="success" loading={isPending} />
            <StatCard label="Monthly Revenue" value={data && formatCurrency(data.revenue.value)} icon={<SavingsOutlined />} tone="success" change={data && percentChange(data.revenue.value, data.revenue.previous)} helper="vs last month" loading={isPending} />
            <StatCard label="Monthly Expenses" value={data && formatCurrency(data.expenses.value)} icon={<AccountBalanceWalletOutlined />} tone="error" change={data && percentChange(data.expenses.value, data.expenses.previous)} increaseIsGood={false} helper="vs last month" loading={isPending} />
            <StatCard label="Net Revenue" value={data && formatCurrency(data.netRevenue)} icon={<CurrencyRupee />} tone={data && data.netRevenue < 0 ? "error" : "primary"} helper="this month" loading={isPending} />
            <StatCard label="Pending Payments" value={data && formatCurrency(data.pendingPayments.amount)} icon={<PendingActionsOutlined />} tone="warning" helper={data ? `${data.pendingPayments.invoices} invoices` : undefined} loading={isPending} />
            <StatCard label="Follow-ups Due" value={data?.followUpsDue} icon={<EventRepeatOutlined />} tone="secondary" helper={data ? `next 7 days · ${data.activeServices} active ${terms.services.toLowerCase()}` : undefined} loading={isPending} />
          </StatGrid>

          <Grid columns="minmax(0, 2fr) minmax(0, 1fr)">
            <SectionCard title="Revenue Overview" subtitle="Collections vs expenses, last 6 months" action={can("reports.view") && <Button size="small" component={Link} href="/reports/revenue">Revenue report</Button>}>
              <TrendChart data={data?.revenueTrend ?? []} series={[{ key: "revenue", label: "Revenue" }, { key: "expenses", label: "Expenses" }]} valueFormatter={formatCurrency} axisFormatter={formatCurrencyCompact} />
            </SectionCard>
            <SectionCard title="Payment Collection" subtitle="This month by method">
              <BreakdownBars items={(data?.paymentCollection ?? []).map((p) => ({ label: p.label, value: p.value }))} valueFormatter={formatCurrency} color={chartColors[2]} />
            </SectionCard>
          </Grid>
          <Grid>
            <SectionCard title="Appointment Trends" subtitle="Completed, cancelled and no-shows by month">
              <TrendChart data={data?.appointmentTrend ?? []} series={[{ key: "completed", label: "Completed" }, { key: "cancelled", label: "Cancelled" }, { key: "noShow", label: "No show" }]} height={260} integerAxis />
            </SectionCard>
            <SectionCard title="Patient Growth" subtitle="New registrations by month">
              <TrendChart data={data?.patientGrowth ?? []} series={[{ key: "patients", label: "New patients", color: chartColors[2] }]} height={260} integerAxis />
            </SectionCard>
          </Grid>
          <Grid>
            <SectionCard title={`${terms.service} Performance`} subtitle="Top services this month by value">
              <BreakdownBars items={(data?.servicePerformance ?? []).map((s) => ({ label: s.label, value: s.value, meta: `${s.count} done` }))} valueFormatter={formatCurrency} />
            </SectionCard>
            <SectionCard title="Expense Overview" subtitle="This month by category" action={can("reports.view") && <Button size="small" component={Link} href="/reports/expenses">Expense report</Button>}>
              <BreakdownBars items={(data?.expenseOverview ?? []).map((e) => ({ label: e.label, value: e.value }))} valueFormatter={formatCurrency} color={chartColors[1]} />
            </SectionCard>
          </Grid>
          <Grid>
            <SectionCard title="Upcoming Appointments" action={<Button size="small" component={Link} href="/appointments?view=day">Day view</Button>} disablePadding>
              {data && data.upcomingAppointments.length === 0 ? <EmptyState compact title="No upcoming appointments" icon={<EventAvailableOutlined />} /> : <List sx={{ p: 1 }}>{data?.upcomingAppointments.map((a) => <AppointmentListItem key={a.id} appointment={a} />)}</List>}
            </SectionCard>
            <SectionCard title="Recent Payments" action={can("billing.view") && <Button size="small" component={Link} href="/billing">Billing</Button>}>
              {data && data.recentPayments.length === 0 ? <EmptyState compact title="No payments yet" /> : data?.recentPayments.map((p) => <PaymentRow key={p.id} payment={p} />)}
            </SectionCard>
          </Grid>
          <Grid columns="minmax(0, 3fr) minmax(0, 2fr)">
            <SectionCard title="Recent Patients" action={<Button size="small" component={Link} href="/patients">All patients</Button>} disablePadding>
              <DataTable embedded pagination={false} columns={patientColumns} rows={data?.recentPatients ?? []} loading={isPending} getRowId={(r) => r.id} onRowClick={(r) => router.push(`/patients/${r.id}`)} emptyState={<EmptyState compact title="No patients yet" />} />
            </SectionCard>
            <SectionCard title="Recent Activities" action={can("audit.view") && <Button size="small" component={Link} href="/reports/activity">Audit log</Button>} disablePadding>
              {data?.recentActivity.length === 0 && <EmptyState compact title="No activity yet" icon={<MedicalServicesOutlined />} />}
              <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
                {data?.recentActivity.map((log) => (
                  <Box component="li" key={log.id} sx={{ px: 2.5, py: 1.25, borderBottom: 1, borderColor: "divider" }}>
                    <Typography variant="body2" noWrap title={log.description}>{log.description}</Typography>
                    <Typography variant="caption" color="text.secondary">{log.memberName} · {formatRelativeTime(log.at)}</Typography>
                  </Box>
                ))}
              </Box>
            </SectionCard>
          </Grid>
        </>
      )}
    </>
  );
}

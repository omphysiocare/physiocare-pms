"use client";

import { FileDownloadOutlined, LockOutlined, PictureAsPdfOutlined } from "@mui/icons-material";
import { Box, Button, Card, LinearProgress, MenuItem, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";

import { BreakdownBars, TrendChart } from "@/components/charts";
import { DataTable, EmptyState, ErrorState, PageHeader, SectionCard, StatCard, StatGrid, type Column } from "@/components/common";
import { PrintButton, ReportDocument } from "@/components/print";
import { useBranches, useCatalog, useClinic } from "@/hooks/useClinic";
import { usePdfDownload } from "@/hooks/useDocuments";
import { useReport } from "@/hooks/useInsights";
import { useMembers } from "@/hooks/useMembers";
import { capAtToday, PERIOD_PRESETS, resolvePeriod, today, type PeriodPreset } from "@/lib/dates";
import { exportReportCsv } from "@/lib/export/csv";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";
import { FILTER_LABELS, type ReportDefinition } from "@/lib/reports/definitions";
import { formatReportValue } from "@/lib/reports/format";
import { useAuth } from "@/providers/AuthProvider";
import { useBranch } from "@/providers/BranchProvider";
import { useNotify } from "@/providers/NotificationProvider";
import { pdfService } from "@/services/pdfService";
import { reportService } from "@/services/reportService";
import { chartColors } from "@/theme/theme";
import {
  ACTIVITY_MODULES,
  APPOINTMENT_STATUSES,
  EXPENSE_CATEGORIES,
  GENDERS,
  PAYMENT_METHODS,
  REFERRAL_SOURCES,
  type ReportFilterKey,
  type ReportFilters,
  type ReportRow,
} from "@/types";

import { REPORT_ICONS } from "./ReportsHub";

const SUMMARY_TONES = ["primary", "secondary", "success", "warning", "info", "error"] as const;

export default function ReportView({ definition }: { definition: ReportDefinition }) {
  const { can } = useAuth();
  const notify = useNotify();
  const { branchId: globalBranch } = useBranch();
  const { data: clinic } = useClinic();
  const { data: branches = [] } = useBranches();
  const { data: members = [] } = useMembers();
  const { data: catalog = [] } = useCatalog();
  const pdf = usePdfDownload();

  const [preset, setPreset] = useState<PeriodPreset>(definition.slug === "daily" ? "this_week" : definition.slug === "profit-loss" || definition.slug === "referrals" ? "last_12_months" : "this_month");
  const [customFrom, setCustomFrom] = useState(resolvePeriod("this_month").from);
  const [customTo, setCustomTo] = useState(today());
  const [branchId, setBranchId] = useState(globalBranch);
  const [values, setValues] = useState<Partial<Record<ReportFilterKey, string>>>({});

  const range = useMemo(() => {
    const resolved = resolvePeriod(preset, { from: customFrom, to: customTo });
    // Outstanding/activity look at the past; future-dated rows only matter for appointments.
    return definition.slug === "appointments" ? resolved : capAtToday(resolved);
  }, [preset, customFrom, customTo, definition.slug]);
  const filters: ReportFilters = useMemo(() => ({ ...range, branchId: definition.branchScoped ? branchId : "all", ...Object.fromEntries(Object.entries(values).filter(([, v]) => v)) }), [range, branchId, values, definition.branchScoped]);
  const { data: report, isPending, isFetching, isError, error, refetch } = useReport(definition.slug, filters);

  if (definition.slug === "activity" && !can("audit.view")) {
    return (
      <Card>
        <EmptyState icon={<LockOutlined />} title="Audit log restricted" description='Your role needs the "audit.view" permission to see the activity report.' />
      </Card>
    );
  }

  const options: Record<ReportFilterKey, { value: string; label: string }[]> = {
    provider: members.filter((m) => m.isProvider).map((m) => ({ value: m.id, label: m.name })),
    member: members.map((m) => ({ value: m.id, label: `${m.name} (${m.role})` })),
    gender: GENDERS.map((g) => ({ value: g, label: g })),
    referral: REFERRAL_SOURCES.map((r) => ({ value: r, label: r })),
    service: catalog.map((s) => ({ value: s.id, label: s.name })),
    appointmentStatus: APPOINTMENT_STATUSES.map((s) => ({ value: s, label: s })),
    paymentMethod: PAYMENT_METHODS.map((m) => ({ value: m, label: m })),
    expenseCategory: EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c })),
    module: ACTIVITY_MODULES.map((m) => ({ value: m, label: m })),
  };

  const columns: Column<ReportRow & { __index: number }>[] = (report?.columns ?? []).map((column) => ({
    id: column.key,
    label: column.label,
    align: column.align,
    render: (row) => formatReportValue(row[column.key], column.format),
    sortValue: (row) => row[column.key] ?? null,
  }));
  const rows = (report?.rows ?? []).map((row, index) => ({ ...row, __index: index }));

  const logExport = (format: "CSV" | "PDF" | "Print") => void reportService.logExport(definition.slug, format).catch(() => undefined);
  const exportCsv = () => {
    if (!report) return;
    const name = exportReportCsv(report);
    logExport("CSV");
    notify.success(`${name} downloaded (${report.rows.length} rows)`);
  };

  return (
    <>
      <PageHeader
        title={definition.title}
        description={definition.description}
        backHref="/reports"
        backLabel="Reports"
        actions={
          can("reports.export") && (
            <>
              <PrintButton title={`${definition.title}`} disabled={!report || !clinic} document={() => (report && clinic ? <ReportDocument clinic={clinic} report={report} /> : null)} onPrinted={() => logExport("Print")} />
              <Button variant="outlined" startIcon={<PictureAsPdfOutlined />} disabled={!report} loading={pdf.pending} onClick={async () => { if (report && (await pdf.download(() => pdfService.report(report)))) logExport("PDF"); }}>Export PDF</Button>
              <Button variant="contained" startIcon={<FileDownloadOutlined />} disabled={!report} onClick={exportCsv}>Export CSV</Button>
            </>
          )
        }
      />

      <Card sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(auto-fit, minmax(170px, 1fr))" }, alignItems: "center" }}>
          <TextField select label="Period" value={preset} onChange={(e) => setPreset(e.target.value as PeriodPreset)}>
            {PERIOD_PRESETS.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
          </TextField>
          {preset === "custom" && (
            <>
              <TextField type="date" label="From" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField type="date" label="To" value={customTo} onChange={(e) => setCustomTo(e.target.value)} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: customFrom } }} />
            </>
          )}
          {definition.branchScoped && branches.length > 1 && (
            <TextField select label="Branch" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <MenuItem value="all">All branches (consolidated)</MenuItem>
              {branches.map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
            </TextField>
          )}
          {definition.filters.map((key) => (
            <TextField key={key} select label={FILTER_LABELS[key]} value={values[key] ?? ""} onChange={(e) => setValues((current) => ({ ...current, [key]: e.target.value }))} slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}>
              <MenuItem value="">All</MenuItem>
              {options[key].map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
          ))}
        </Box>
        {report && (
          <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
            {report.appliedFilters.map((f) => `${f.label}: ${f.value}`).join(" · ")}
          </Typography>
        )}
        {isFetching && <LinearProgress sx={{ mt: 1, height: 2 }} />}
      </Card>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <>
          <StatGrid columns={report && report.summary.length > 4 ? 6 : 4}>
            {(report?.summary ?? Array.from({ length: 4 }, (_, i) => ({ label: "…", value: 0, format: "number" as const, hint: undefined, key: i }))).map((item, index) => (
              <StatCard key={`${item.label}-${index}`} label={item.label} value={formatReportValue(item.value, item.format)} helper={item.hint} icon={REPORT_ICONS[definition.slug]} tone={SUMMARY_TONES[index % SUMMARY_TONES.length]} loading={isPending} />
            ))}
          </StatGrid>

          {report && report.charts.length > 0 && (
            <Box sx={{ display: "grid", gap: 3, mb: 3, gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "repeat(2, minmax(0, 1fr))" } }}>
              {report.charts.map((chart, index) => (
                <SectionCard key={chart.id} title={chart.title}>
                  {chart.type === "breakdown" ? (
                    <BreakdownBars
                      items={chart.data.map((point) => ({ label: String(point.label), value: Number(point.value) }))}
                      valueFormatter={(v) => formatReportValue(v, chart.format)}
                      color={chartColors[index % chartColors.length]}
                    />
                  ) : (
                    <TrendChart
                      variant={chart.type === "line" ? "line" : "bar"}
                      height={260}
                      data={chart.data}
                      series={chart.series}
                      integerAxis={chart.format === "number"}
                      valueFormatter={chart.format === "currency" ? formatCurrency : (v) => formatReportValue(v, chart.format)}
                      axisFormatter={chart.format === "currency" ? formatCurrencyCompact : undefined}
                    />
                  )}
                </SectionCard>
              ))}
            </Box>
          )}

          <SectionCard title="Report data" subtitle={report ? `${report.rows.length} rows · exports include exactly these rows` : undefined} disablePadding>
            <DataTable embedded columns={columns} rows={rows} loading={isPending} getRowId={(row) => String(row.__index)} defaultRowsPerPage={25} resetKey={JSON.stringify(filters)} emptyState={<EmptyState compact title="No data for these filters" description="Try a wider date range or remove filters." />} />
            {report?.totals && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, px: 2.5, py: 1.5, borderTop: 1, borderColor: "divider", bgcolor: "grey.50" }}>
                {report.columns.filter((c) => report.totals?.[c.key] !== undefined && report.totals?.[c.key] !== null).map((c) => (
                  <Box key={c.key}>
                    <Typography variant="caption" color="text.secondary">{c.label === report.columns[0].label ? "" : c.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatReportValue(report.totals?.[c.key] ?? null, c.format)}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </SectionCard>
        </>
      )}
    </>
  );
}

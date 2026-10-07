import { Box, Typography } from "@mui/material";

import { IdLink, PatientCell, StatusChip, type Column } from "@/components/common";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import type { ServiceRecordWithRelations, Terminology } from "@/types";

export function getServiceRecordColumns(terms: Terminology, { hidePatient = false } = {}): Column<ServiceRecordWithRelations>[] {
  const columns: (Column<ServiceRecordWithRelations> | false)[] = [
    { id: "id", label: "ID", render: (row) => <IdLink id={row.id} href={`/treatments/${row.id}`} />, sortValue: (row) => row.id, hideBelow: "md" },
    !hidePatient && { id: "patient", label: "Patient", render: (row) => <PatientCell patient={row.patient} />, sortValue: (row) => row.patient.name },
    {
      id: "service",
      label: terms.service,
      render: (row) => (
        <>
          <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
            {row.serviceName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap component="p">
            {[row.service.category, row.area].filter(Boolean).join(" · ")}
          </Typography>
        </>
      ),
      sortValue: (row) => row.serviceName,
      hideBelow: "sm",
    },
    { id: "session", label: "Session", render: (row) => <Box component="span" sx={{ whiteSpace: "nowrap" }}>{row.sessionNumber} / {row.totalSessions}</Box>, sortValue: (row) => row.sessionNumber, hideBelow: "lg" },
    {
      id: "date",
      label: "Date",
      render: (row) => (
        <Box sx={{ whiteSpace: "nowrap" }}>
          <Typography variant="body2">{formatDate(row.date)}</Typography>
          <Typography variant="caption" color="text.secondary">
            {formatTime(row.startTime)} · {row.durationMinutes} min
          </Typography>
        </Box>
      ),
      sortValue: (row) => `${row.date}${row.startTime}`,
    },
    { id: "provider", label: terms.provider, render: (row) => row.provider.name, sortValue: (row) => row.provider.name, hideBelow: "lg" },
    { id: "amount", label: "Amount", align: "right", render: (row) => formatCurrency(row.amount), sortValue: (row) => row.amount, hideBelow: "md" },
    { id: "status", label: "Status", render: (row) => <StatusChip status={row.status} />, sortValue: (row) => row.status },
  ];
  return columns.filter((column): column is Column<ServiceRecordWithRelations> => Boolean(column));
}

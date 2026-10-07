import { Box, Typography } from "@mui/material";

import { IdLink, PatientCell, StatusChip, type Column } from "@/components/common";
import { formatDate, formatTime } from "@/lib/format";
import type { AppointmentWithRelations } from "@/types";

export function getAppointmentColumns({ hidePatient = false } = {}): Column<AppointmentWithRelations>[] {
  const columns: (Column<AppointmentWithRelations> | false)[] = [
    { id: "id", label: "ID", render: (row) => <IdLink id={row.id} href={`/appointments/${row.id}`} />, sortValue: (row) => row.id, hideBelow: "lg" },
    !hidePatient && { id: "patient", label: "Patient", render: (row) => <PatientCell patient={row.patient} />, sortValue: (row) => row.patient.name },
    {
      id: "date",
      label: "Date & Time",
      render: (row) => (
        <Box sx={{ whiteSpace: "nowrap" }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {formatDate(row.date, "ddd, DD MMM YYYY")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatTime(row.startTime)} – {formatTime(row.endTime)}
          </Typography>
        </Box>
      ),
      sortValue: (row) => `${row.date}${row.startTime}`,
    },
    {
      id: "type",
      label: "Type / Service",
      render: (row) => (
        <>
          <Typography variant="body2">{row.type}</Typography>
          {row.service && (
            <Typography variant="caption" color="text.secondary" noWrap component="p" sx={{ maxWidth: 200 }}>
              {row.service.name}
            </Typography>
          )}
        </>
      ),
      sortValue: (row) => row.type,
      hideBelow: "sm",
    },
    { id: "provider", label: "Provider", render: (row) => row.provider.name, sortValue: (row) => row.provider.name, hideBelow: "lg" },
    { id: "branch", label: "Location", render: (row) => `${row.branch.name}${row.location ? ` · ${row.location}` : ""}`, sortValue: (row) => row.branch.name, hideBelow: "xl" },
    { id: "status", label: "Status", render: (row) => <StatusChip status={row.status} />, sortValue: (row) => row.status },
  ];
  return columns.filter((column): column is Column<AppointmentWithRelations> => Boolean(column));
}

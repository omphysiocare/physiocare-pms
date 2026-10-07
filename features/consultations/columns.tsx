import { Chip, Typography } from "@mui/material";

import { IdLink, PatientCell, type Column } from "@/components/common";
import { formatDate } from "@/lib/format";
import type { ConsultationWithRelations } from "@/types";

export function getConsultationColumns({ hidePatient = false } = {}): Column<ConsultationWithRelations>[] {
  const columns: (Column<ConsultationWithRelations> | false)[] = [
    { id: "id", label: "ID", render: (row) => <IdLink id={row.id} href={`/consultations/${row.id}`} />, sortValue: (row) => row.id, hideBelow: "md" },
    !hidePatient && { id: "patient", label: "Patient", render: (row) => <PatientCell patient={row.patient} />, sortValue: (row) => row.patient.name },
    { id: "date", label: "Date", render: (row) => <span style={{ whiteSpace: "nowrap" }}>{formatDate(row.date)}</span>, sortValue: (row) => row.date },
    {
      id: "diagnosis",
      label: "Diagnosis",
      render: (row) => (
        <>
          <Typography variant="body2" sx={{ fontWeight: 500, maxWidth: { xs: 150, sm: 220, lg: 280 } }} noWrap title={row.diagnosis}>
            {row.diagnosis}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ maxWidth: { xs: 150, sm: 220, lg: 280 }, display: "block" }} noWrap title={row.chiefComplaint}>
            {row.chiefComplaint}
          </Typography>
        </>
      ),
      sortValue: (row) => row.diagnosis,
      hideBelow: "sm",
    },
    { id: "visitType", label: "Visit", render: (row) => <Chip size="small" variant="outlined" label={row.visitType} />, sortValue: (row) => row.visitType },
    { id: "provider", label: "Provider", render: (row) => row.provider.name, sortValue: (row) => row.provider.name, hideBelow: "lg" },
    { id: "rx", label: "Rx items", align: "right", render: (row) => row.prescription.length, sortValue: (row) => row.prescription.length, hideBelow: "xl" },
    { id: "followUp", label: "Follow-up", render: (row) => formatDate(row.followUpDate), sortValue: (row) => row.followUpDate, hideBelow: "lg" },
  ];
  return columns.filter((column): column is Column<ConsultationWithRelations> => Boolean(column));
}

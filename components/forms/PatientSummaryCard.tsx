"use client";

import { Box, Link as MuiLink, Skeleton, Typography } from "@mui/material";
import Link from "next/link";

import PersonAvatar from "@/components/common/PersonAvatar";
import StatusChip from "@/components/common/StatusChip";
import { usePatient } from "@/hooks/usePatients";
import { formatDate } from "@/lib/format";

/** Compact patient context shown inside clinical and billing forms. */
export default function PatientSummaryCard({ patientId }: { patientId: string }) {
  const { data: patient, isPending } = usePatient(patientId);

  if (!patientId) {
    return (
      <Box sx={{ p: 2, borderRadius: 2, border: 1, borderStyle: "dashed", borderColor: "divider", color: "text.secondary", height: "100%", display: "flex", alignItems: "center" }}>
        <Typography variant="body2">Select a patient to see their details.</Typography>
      </Box>
    );
  }

  if (isPending || !patient) {
    return <Skeleton variant="rounded" height={88} />;
  }

  return (
    <Box sx={{ p: 2, borderRadius: 2, bgcolor: "grey.50", border: 1, borderColor: "divider", display: "flex", gap: 1.5, alignItems: "flex-start" }}>
      <PersonAvatar name={patient.name} size={40} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <MuiLink component={Link} href={`/patients/${patient.id}`} underline="hover" sx={{ fontWeight: 600 }} target="_blank">
            {patient.name}
          </MuiLink>
          <StatusChip status={patient.status} />
        </Box>
        <Typography variant="caption" color="text.secondary" component="p">
          {patient.id} · {patient.gender}, {patient.age} yrs · {patient.phone} · {patient.branchName}
        </Typography>
        <Typography variant="caption" component="p" sx={{ mt: 0.5 }} noWrap title={patient.medical.primaryCondition}>
          <strong>Condition:</strong> {patient.medical.primaryCondition || "—"}
        </Typography>
        {patient.medical.allergies && patient.medical.allergies !== "None known" && (
          <Typography variant="caption" color="error.main" component="p" sx={{ fontWeight: 600 }}>
            Allergies: {patient.medical.allergies}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" component="p">
          Last visit: {formatDate(patient.lastVisit)} · Provider: {patient.primaryProviderName}
        </Typography>
      </Box>
    </Box>
  );
}

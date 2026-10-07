import { Box, Link as MuiLink, Typography } from "@mui/material";
import Link from "next/link";

import type { PatientRef } from "@/types";

import PersonAvatar from "./PersonAvatar";

interface PatientCellProps {
  patient: Pick<PatientRef, "id" | "name"> & { phone?: string };
  /** Secondary line; defaults to the patient ID. */
  secondary?: string;
  link?: boolean;
}

/** Avatar + name + ID, used wherever a patient appears in a table. */
export default function PatientCell({ patient, secondary, link = true }: PatientCellProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
      <PersonAvatar name={patient.name} size={34} />
      <Box sx={{ minWidth: 0 }}>
        {link ? (
          <MuiLink
            component={Link}
            href={`/patients/${patient.id}`}
            onClick={(event) => event.stopPropagation()}
            underline="hover"
            color="text.primary"
            sx={{ fontWeight: 600, fontSize: 14, display: "block" }}
            noWrap
          >
            {patient.name}
          </MuiLink>
        ) : (
          <Typography sx={{ fontWeight: 600, fontSize: 14 }} noWrap>
            {patient.name}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" noWrap component="p">
          {secondary ?? patient.id}
        </Typography>
      </Box>
    </Box>
  );
}

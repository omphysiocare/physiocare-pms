import { Box, ListItemButton, Typography } from "@mui/material";
import Link from "next/link";

import StatusChip from "@/components/common/StatusChip";
import { formatRelativeDay, formatTime } from "@/lib/format";
import type { AppointmentWithRelations } from "@/types";

/** Compact appointment row used in dashboards and side panels. */
export default function AppointmentListItem({ appointment, hidePatient, showDate = true }: { appointment: AppointmentWithRelations; hidePatient?: boolean; showDate?: boolean }) {
  return (
    <ListItemButton component={Link} href={`/appointments/${appointment.id}`} sx={{ borderRadius: 2, gap: 2, py: 1.25, alignItems: "center" }}>
      <Box sx={{ width: 80, flexShrink: 0, textAlign: "center", py: 0.75, borderRadius: 2, bgcolor: "grey.50", border: 1, borderColor: "divider" }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2, whiteSpace: "nowrap" }}>{formatTime(appointment.startTime)}</Typography>
        {showDate && <Typography sx={{ fontSize: 11, color: "text.secondary", lineHeight: 1.3 }}>{formatRelativeDay(appointment.date)}</Typography>}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {hidePatient ? appointment.type : appointment.patient.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap component="p">
          {hidePatient ? appointment.provider.name : `${appointment.type} · ${appointment.provider.name}`}
        </Typography>
      </Box>
      <StatusChip status={appointment.status} sx={{ display: { xs: "none", sm: "inline-flex" } }} />
    </ListItemButton>
  );
}

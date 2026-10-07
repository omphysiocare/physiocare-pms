"use client";

import { Box, Tooltip, Typography } from "@mui/material";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

import { formatTime } from "@/lib/format";
import { getStatusTone } from "@/lib/status";
import { TONES } from "@/theme/tones";
import type { AppointmentWithRelations } from "@/types";

import { layoutColumn, minutesOf } from "./layout";

export interface GridColumn {
  key: string;
  label: string;
  sublabel?: string;
  date: string;
  providerId?: string;
  appointments: AppointmentWithRelations[];
  highlight?: boolean;
}

const HOUR_HEIGHT = 64;
const MUTED_STATUSES = ["Cancelled", "No Show"];

interface TimeGridProps {
  columns: GridColumn[];
  startHour: number;
  endHour: number;
  providerColors: Record<string, string>;
  canCreate: boolean;
}

/** Shared day/week time grid with absolutely positioned, lane-aware appointment blocks. */
export default function TimeGrid({ columns, startHour, endHour, providerColors, canCreate }: TimeGridProps) {
  const router = useRouter();
  const hours = Array.from({ length: endHour - startHour }, (_, index) => startHour + index);
  const height = hours.length * HOUR_HEIGHT;
  const nowMinutes = dayjs().hour() * 60 + dayjs().minute();
  const today = dayjs().format("YYYY-MM-DD");
  const minColumnWidth = columns.length > 4 ? 120 : 180;

  const onSlotClick = (column: GridColumn, offsetY: number) => {
    if (!canCreate) return;
    const minutes = startHour * 60 + Math.floor(offsetY / (HOUR_HEIGHT / 4)) * 15;
    const time = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    const params = new URLSearchParams({ date: column.date, time });
    if (column.providerId) params.set("providerId", column.providerId);
    router.push(`/appointments/new?${params.toString()}`);
  };

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Box sx={{ display: "grid", gridTemplateColumns: `56px repeat(${columns.length}, minmax(${minColumnWidth}px, 1fr))`, minWidth: 56 + columns.length * minColumnWidth }}>
        {/* Header row */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", position: "sticky", top: 0, bgcolor: "background.paper", zIndex: 2 }} />
        {columns.map((column) => (
          <Box key={column.key} sx={{ px: 1, py: 1.25, borderBottom: 1, borderLeft: 1, borderColor: "divider", textAlign: "center", bgcolor: column.highlight ? "#EFF6FF" : "background.paper", position: "sticky", top: 0, zIndex: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
              {column.label}
            </Typography>
            {column.sublabel && (
              <Typography variant="caption" color="text.secondary" noWrap component="p">
                {column.sublabel}
              </Typography>
            )}
          </Box>
        ))}

        {/* Hour labels */}
        <Box sx={{ position: "relative", height }}>
          {hours.map((hour, index) => (
            <Typography key={hour} variant="caption" color="text.secondary" sx={{ position: "absolute", top: index * HOUR_HEIGHT - 7, right: 8, fontSize: 11 }}>
              {index === 0 ? "" : dayjs().hour(hour).minute(0).format("h A")}
            </Typography>
          ))}
        </Box>

        {columns.map((column) => (
          <Box
            key={column.key}
            role={canCreate ? "button" : undefined}
            aria-label={canCreate ? `Book on ${column.label}` : undefined}
            onClick={(event) => {
              if (event.target !== event.currentTarget) return;
              const rect = event.currentTarget.getBoundingClientRect();
              onSlotClick(column, event.clientY - rect.top);
            }}
            sx={{
              position: "relative",
              height,
              borderLeft: 1,
              borderColor: "divider",
              cursor: canCreate ? "copy" : "default",
              backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${HOUR_HEIGHT - 1}px, #E2E8F0 ${HOUR_HEIGHT - 1}px, #E2E8F0 ${HOUR_HEIGHT}px)`,
              bgcolor: column.highlight ? "rgba(239,246,255,0.45)" : undefined,
            }}
          >
            {column.date === today && nowMinutes >= startHour * 60 && nowMinutes <= endHour * 60 && (
              <Box sx={{ position: "absolute", left: 0, right: 0, top: ((nowMinutes - startHour * 60) / 60) * HOUR_HEIGHT, height: 2, bgcolor: "error.main", zIndex: 1, pointerEvents: "none", "&::before": { content: '""', position: "absolute", left: -4, top: -3, width: 8, height: 8, borderRadius: "50%", bgcolor: "error.main" } }} />
            )}
            {layoutColumn(column.appointments).map(({ appointment, lane, lanes }) => {
              const top = ((minutesOf(appointment.startTime) - startHour * 60) / 60) * HOUR_HEIGHT;
              const blockHeight = Math.max(((minutesOf(appointment.endTime) - minutesOf(appointment.startTime)) / 60) * HOUR_HEIGHT - 2, 22);
              const tone = TONES[getStatusTone(appointment.status)];
              const muted = MUTED_STATUSES.includes(appointment.status);
              return (
                <Tooltip
                  key={appointment.id}
                  title={`${formatTime(appointment.startTime)}–${formatTime(appointment.endTime)} · ${appointment.patient.name} · ${appointment.type} · ${appointment.provider.name} · ${appointment.status}`}
                >
                  <Box
                    component="button"
                    type="button"
                    onClick={() => router.push(`/appointments/${appointment.id}`)}
                    sx={{
                      position: "absolute",
                      top: top + 1,
                      height: blockHeight,
                      left: `calc(${(lane / lanes) * 100}% + 2px)`,
                      width: `calc(${100 / lanes}% - 4px)`,
                      border: 0,
                      borderLeft: `3px solid ${providerColors[appointment.providerId] ?? tone.fg}`,
                      borderRadius: 1,
                      bgcolor: muted ? "#F8FAFC" : tone.bg,
                      color: "text.primary",
                      textAlign: "left",
                      px: 0.75,
                      py: 0.25,
                      overflow: "hidden",
                      cursor: "pointer",
                      font: "inherit",
                      opacity: muted ? 0.65 : 1,
                      zIndex: 2,
                      boxShadow: "0 1px 2px rgba(15,23,42,0.08)",
                      "&:hover": { boxShadow: "0 4px 10px rgba(15,23,42,0.15)", zIndex: 3 },
                      "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main" },
                    }}
                  >
                    <Typography sx={{ fontSize: 11, fontWeight: 700, lineHeight: 1.25, textDecoration: muted ? "line-through" : "none" }} noWrap>
                      {lanes > 1 ? appointment.patient.name.split(" ")[0] : `${formatTime(appointment.startTime)} · ${appointment.patient.name}`}
                    </Typography>
                    {blockHeight > 30 && lanes < 3 && (
                      <Typography sx={{ fontSize: 10.5, color: tone.fg, lineHeight: 1.25 }} noWrap>
                        {appointment.status} · {appointment.type}
                      </Typography>
                    )}
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

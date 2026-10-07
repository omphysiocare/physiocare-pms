"use client";

import { Box, ButtonBase, Typography } from "@mui/material";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

import { formatTime } from "@/lib/format";
import { getStatusTone } from "@/lib/status";
import { TONES } from "@/theme/tones";
import type { AppointmentWithRelations } from "@/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface MonthViewProps {
  anchor: string;
  appointments: AppointmentWithRelations[];
  onOpenDay: (date: string) => void;
}

/** Month calendar: up to three appointments per day, "+N more" opens the day view. */
export default function MonthView({ anchor, appointments, onOpenDay }: MonthViewProps) {
  const router = useRouter();
  const monthStart = dayjs(anchor).startOf("month");
  const gridStart = monthStart.subtract((monthStart.day() + 6) % 7, "day");
  const days = Array.from({ length: 42 }, (_, index) => gridStart.add(index, "day"));
  const byDate = new Map<string, AppointmentWithRelations[]>();
  for (const appointment of appointments) {
    const list = byDate.get(appointment.date) ?? [];
    list.push(appointment);
    byDate.set(appointment.date, list);
  }
  const today = dayjs().format("YYYY-MM-DD");

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(110px, 1fr))", minWidth: 770 }}>
        {WEEKDAYS.map((day) => (
          <Box key={day} sx={{ py: 1, textAlign: "center", borderBottom: 1, borderColor: "divider", bgcolor: "grey.50" }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
              {day}
            </Typography>
          </Box>
        ))}
        {days.map((day) => {
          const iso = day.format("YYYY-MM-DD");
          const list = (byDate.get(iso) ?? []).sort((a, b) => a.startTime.localeCompare(b.startTime));
          const inMonth = day.month() === monthStart.month();
          return (
            <Box
              key={iso}
              onClick={(event) => event.target === event.currentTarget && onOpenDay(iso)}
              sx={{ minHeight: 112, p: 0.75, borderRight: 1, borderBottom: 1, borderColor: "divider", bgcolor: inMonth ? "background.paper" : "grey.50", cursor: "pointer" }}
            >
              <ButtonBase onClick={() => onOpenDay(iso)} sx={{ borderRadius: "50%", width: 26, height: 26, mb: 0.5, bgcolor: iso === today ? "primary.main" : undefined, color: iso === today ? "primary.contrastText" : inMonth ? "text.primary" : "text.disabled", fontSize: 12, fontWeight: 700 }}>
                {day.date()}
              </ButtonBase>
              {list.slice(0, 3).map((appointment) => {
                const tone = TONES[getStatusTone(appointment.status)];
                return (
                  <ButtonBase
                    key={appointment.id}
                    onClick={() => router.push(`/appointments/${appointment.id}`)}
                    sx={{ display: "block", width: "100%", textAlign: "left", borderRadius: 1, px: 0.5, py: 0.25, mb: 0.25, bgcolor: tone.bg, fontSize: 11, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}
                  >
                    <Box component="span" sx={{ fontWeight: 700, color: tone.fg }}>
                      {formatTime(appointment.startTime).replace(":00", "")}
                    </Box>{" "}
                    {appointment.patient.name}
                  </ButtonBase>
                );
              })}
              {list.length > 3 && (
                <ButtonBase onClick={() => onOpenDay(iso)} sx={{ fontSize: 11, fontWeight: 600, color: "primary.main", px: 0.5 }}>
                  +{list.length - 3} more
                </ButtonBase>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

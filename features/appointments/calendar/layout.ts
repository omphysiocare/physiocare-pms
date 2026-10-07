import type { AppointmentWithRelations } from "@/types";

export function minutesOf(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export interface PositionedAppointment {
  appointment: AppointmentWithRelations;
  lane: number;
  lanes: number;
}

/** Assigns side-by-side lanes to overlapping appointments within one column. */
export function layoutColumn(appointments: AppointmentWithRelations[]): PositionedAppointment[] {
  const sorted = [...appointments].sort((a, b) => a.startTime.localeCompare(b.startTime) || a.endTime.localeCompare(b.endTime));
  const result: PositionedAppointment[] = [];
  let cluster: PositionedAppointment[] = [];
  let clusterEnd = -1;
  let laneEnds: number[] = [];

  const flush = () => {
    const lanes = Math.max(1, laneEnds.length);
    cluster.forEach((item) => (item.lanes = lanes));
    result.push(...cluster);
    cluster = [];
    laneEnds = [];
  };

  for (const appointment of sorted) {
    const start = minutesOf(appointment.startTime);
    const end = Math.max(minutesOf(appointment.endTime), start + 15);
    if (start >= clusterEnd && cluster.length) flush();
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else {
      laneEnds[lane] = end;
    }
    cluster.push({ appointment, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, end);
  }
  if (cluster.length) flush();
  return result;
}

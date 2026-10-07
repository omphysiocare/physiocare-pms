import { TONES } from "@/theme/tones";

import { getStatusTone } from "./status";

/** Solid color for a status, used in charts and legends (always paired with a label). */
export function statusColor(status: string): string {
  return TONES[getStatusTone(status)].fg;
}

import type { StatusTone } from "@/lib/status";

import { colors } from "./theme";

export interface ToneColors {
  fg: string;
  bg: string;
}

/** Soft background + strong foreground pairs for chips, icons and badges. */
export const TONES: Record<StatusTone, ToneColors> = {
  primary: { fg: colors.primary, bg: "#EFF6FF" },
  secondary: { fg: colors.secondary, bg: "#F0FDFA" },
  success: { fg: "#15803D", bg: "#F0FDF4" },
  warning: { fg: "#B45309", bg: "#FFFBEB" },
  error: { fg: "#B91C1C", bg: "#FEF2F2" },
  info: { fg: "#0369A1", bg: "#F0F9FF" },
  neutral: { fg: "#475569", bg: "#F1F5F9" },
};

export type Tone = keyof typeof TONES;

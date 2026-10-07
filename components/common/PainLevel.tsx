import { Box, Typography } from "@mui/material";

import { TONES } from "@/theme/tones";

export function painTone(level: number) {
  if (level <= 3) return TONES.success;
  if (level <= 6) return TONES.warning;
  return TONES.error;
}

export function painLabel(level: number): string {
  if (level === 0) return "No pain";
  if (level <= 3) return "Mild";
  if (level <= 6) return "Moderate";
  return "Severe";
}

/** Numeric pain rating (NRS 0–10) with severity label. */
export default function PainLevel({ level, showLabel = true }: { level: number | null; showLabel?: boolean }) {
  if (level === null) return <>—</>;
  const tone = painTone(level);
  return (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, whiteSpace: "nowrap" }}>
      <Box
        component="span"
        sx={{ px: 0.75, py: 0.125, borderRadius: 1, bgcolor: tone.bg, color: tone.fg, fontWeight: 700, fontSize: 12, minWidth: 40, textAlign: "center" }}
      >
        {level}/10
      </Box>
      {showLabel && (
        <Typography component="span" variant="caption" color="text.secondary">
          {painLabel(level)}
        </Typography>
      )}
    </Box>
  );
}

import { Chip, type ChipProps } from "@mui/material";

import { getStatusTone } from "@/lib/status";
import { TONES } from "@/theme/tones";

interface StatusChipProps extends Omit<ChipProps, "color" | "label"> {
  status: string;
  /** Overrides the text while keeping the status colour. */
  label?: string;
}

export default function StatusChip({ status, label, sx, ...props }: StatusChipProps) {
  const tone = TONES[getStatusTone(status)];
  return (
    <Chip
      size="small"
      label={label ?? status}
      sx={[
        {
          bgcolor: tone.bg,
          color: tone.fg,
          border: "1px solid",
          borderColor: `color-mix(in srgb, ${tone.fg} 18%, transparent)`,
          "&::before": {
            content: '""',
            width: 6,
            height: 6,
            borderRadius: "50%",
            bgcolor: tone.fg,
            ml: 1,
          },
          "& .MuiChip-label": { pl: 0.75 },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    />
  );
}

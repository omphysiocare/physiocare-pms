import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

export interface DetailItem {
  label: string;
  value: ReactNode;
  /** Spans the full row (for long text). */
  fullWidth?: boolean;
  hidden?: boolean;
}

/** Label/value grid used inside information cards on every detail page. */
export default function DetailList({ items, columns = 2 }: { items: DetailItem[]; columns?: 1 | 2 | 3 }) {
  return (
    <Box
      component="dl"
      sx={{
        m: 0,
        display: "grid",
        columnGap: 3,
        rowGap: 2.25,
        gridTemplateColumns: { xs: "1fr", sm: `repeat(${Math.min(columns, 2)}, minmax(0, 1fr))`, lg: `repeat(${columns}, minmax(0, 1fr))` },
      }}
    >
      {items
        .filter((item) => !item.hidden)
        .map((item) => (
          <Box key={item.label} sx={{ minWidth: 0, gridColumn: item.fullWidth ? "1 / -1" : undefined }}>
            <Typography component="dt" variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: "block", mb: 0.25 }}>
              {item.label}
            </Typography>
            <Typography
              component="dd"
              variant="body2"
              sx={{ m: 0, fontWeight: 500, whiteSpace: "pre-line", overflowWrap: "anywhere" }}
            >
              {item.value === "" || item.value === null || item.value === undefined ? "—" : item.value}
            </Typography>
          </Box>
        ))}
    </Box>
  );
}

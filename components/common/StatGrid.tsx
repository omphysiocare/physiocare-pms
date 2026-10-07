import { Box } from "@mui/material";
import type { ReactNode } from "react";

/** Responsive grid for summary StatCards. */
export default function StatGrid({ children, columns = 4 }: { children: ReactNode; columns?: 3 | 4 | 6 }) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: { xs: 1.5, sm: 2 },
        mb: 3,
        gridTemplateColumns: {
          xs: "repeat(2, minmax(0, 1fr))",
          sm: "repeat(2, minmax(0, 1fr))",
          lg: `repeat(${columns === 6 ? 3 : Math.min(columns, 4)}, minmax(0, 1fr))`,
          xl: `repeat(${columns}, minmax(0, 1fr))`,
        },
      }}
    >
      {children}
    </Box>
  );
}

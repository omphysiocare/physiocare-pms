import { Box, Stack } from "@mui/material";
import type { ReactNode } from "react";

/** Two-column detail layout: information cards on the left, summary/actions on the right. */
export default function DetailLayout({ main, aside }: { main: ReactNode; aside: ReactNode }) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 3,
        gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 1fr) 340px" },
        alignItems: "start",
      }}
    >
      <Stack spacing={3} sx={{ minWidth: 0 }}>
        {main}
      </Stack>
      <Stack spacing={3} sx={{ minWidth: 0, position: { lg: "sticky" }, top: { lg: 88 } }}>
        {aside}
      </Stack>
    </Box>
  );
}

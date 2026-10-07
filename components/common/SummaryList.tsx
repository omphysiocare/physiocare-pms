import { Box, Divider, Typography } from "@mui/material";
import { Fragment, type ReactNode } from "react";

export interface SummaryRow {
  label: string;
  value: ReactNode;
  emphasis?: boolean;
  hidden?: boolean;
}

/** Right-aligned key/value rows for summary cards (totals, status, counts). */
export default function SummaryList({ rows }: { rows: SummaryRow[] }) {
  const visible = rows.filter((row) => !row.hidden);
  return (
    <Box>
      {visible.map((row, index) => (
        <Fragment key={row.label}>
          {row.emphasis && index > 0 && <Divider sx={{ my: 1 }} />}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, py: 0.875 }}>
            <Typography variant="body2" color={row.emphasis ? "text.primary" : "text.secondary"} sx={{ fontWeight: row.emphasis ? 600 : 400 }}>
              {row.label}
            </Typography>
            <Typography
              variant="body2"
              component="div"
              sx={{ fontWeight: row.emphasis ? 700 : 600, fontSize: row.emphasis ? 16 : undefined, textAlign: "right" }}
            >
              {row.value}
            </Typography>
          </Box>
        </Fragment>
      ))}
    </Box>
  );
}

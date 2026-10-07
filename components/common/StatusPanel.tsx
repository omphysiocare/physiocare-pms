"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

import SectionCard from "./SectionCard";
import StatusChip from "./StatusChip";
import SummaryList, { type SummaryRow } from "./SummaryList";

export interface StatusTransition<S extends string> {
  status: S;
  label: string;
  icon?: ReactNode;
  color?: "primary" | "success" | "error" | "warning" | "inherit";
  variant?: "contained" | "outlined";
}

interface StatusPanelProps<S extends string> {
  title?: string;
  status: S;
  transitions: StatusTransition<S>[];
  onChange: (status: S) => void;
  pending?: boolean;
  /** Extra summary rows shown under the status. */
  rows?: SummaryRow[];
  footer?: ReactNode;
}

/** Status & summary card on detail pages, with buttons for allowed status changes. */
export default function StatusPanel<S extends string>({
  title = "Status & Summary",
  status,
  transitions,
  onChange,
  pending,
  rows = [],
  footer,
}: StatusPanelProps<S>) {
  return (
    <SectionCard title={title}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: rows.length ? 1 : 0 }}>
        <Typography variant="body2" color="text.secondary">
          Current status
        </Typography>
        <StatusChip status={status} />
      </Box>
      {rows.length > 0 && <SummaryList rows={rows} />}
      {transitions.length > 0 && (
        <Stack spacing={1} sx={{ mt: 2 }}>
          {transitions.map((transition) => (
            <Button
              key={transition.status}
              fullWidth
              variant={transition.variant ?? "outlined"}
              color={transition.color ?? "primary"}
              startIcon={transition.icon}
              disabled={pending}
              onClick={() => onChange(transition.status)}
            >
              {transition.label}
            </Button>
          ))}
        </Stack>
      )}
      {footer}
    </SectionCard>
  );
}

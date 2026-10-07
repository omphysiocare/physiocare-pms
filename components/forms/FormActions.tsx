"use client";

import { Box, Button, Card } from "@mui/material";

interface FormActionsProps {
  submitting?: boolean;
  submitLabel?: string;
  onCancel: () => void;
  onReset?: () => void;
  /** Disables reset when nothing changed. */
  isDirty?: boolean;
}

/** Sticky action bar at the bottom of every create/edit form. */
export default function FormActions({ submitting, submitLabel = "Save", onCancel, onReset, isDirty = true }: FormActionsProps) {
  return (
    <Card
      sx={{
        position: "sticky",
        bottom: 16,
        zIndex: 2,
        px: 2.5,
        py: 1.5,
        display: "flex",
        flexWrap: "wrap",
        gap: 1.5,
        justifyContent: "flex-end",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
      }}
    >
      {onReset && (
        <Button color="inherit" onClick={onReset} disabled={submitting || !isDirty} sx={{ mr: "auto" }}>
          Reset
        </Button>
      )}
      <Box sx={{ display: "flex", gap: 1.5, flex: { xs: 1, sm: "0 0 auto" }, "& > *": { flex: { xs: 1, sm: "0 0 auto" } } }}>
        <Button variant="outlined" color="inherit" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" loading={submitting}>
          {submitLabel}
        </Button>
      </Box>
    </Card>
  );
}

"use client";

import { Box, Button, Card, Divider, Typography } from "@mui/material";
import type { FormEventHandler, ReactNode } from "react";

interface SettingsCardProps {
  title: string;
  description: string;
  children: ReactNode;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  onReset?: () => void;
  isDirty?: boolean;
  isSubmitting?: boolean;
  columns?: 1 | 2 | 3;
  readOnly?: boolean;
  action?: ReactNode;
}

/** Shared card for every clinic/account settings section (same header and save bar). */
export default function SettingsCard({ title, description, children, onSubmit, onReset, isDirty, isSubmitting, columns = 2, readOnly, action }: SettingsCardProps) {
  return (
    <Card component={onSubmit ? "form" : "div"} noValidate onSubmit={onSubmit}>
      <Box sx={{ px: 2.5, py: 2, display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" component="h2">{title}</Typography>
          <Typography variant="caption" color="text.secondary">{description}</Typography>
        </Box>
        {action}
      </Box>
      <Divider />
      <Box sx={{ p: 2.5, display: "grid", gap: 2.5, gridTemplateColumns: { xs: "minmax(0, 1fr)", md: `repeat(${Math.min(columns, 2)}, minmax(0, 1fr))`, lg: `repeat(${columns}, minmax(0, 1fr))` } }}>{children}</Box>
      {onSubmit && !readOnly && (
        <>
          <Divider />
          <Box sx={{ px: 2.5, py: 1.5, display: "flex", justifyContent: "flex-end", gap: 1.5, bgcolor: "grey.50" }}>
            <Button color="inherit" onClick={onReset} disabled={!isDirty || isSubmitting}>Discard changes</Button>
            <Button type="submit" variant="contained" loading={isSubmitting} disabled={!isDirty}>Save changes</Button>
          </Box>
        </>
      )}
    </Card>
  );
}

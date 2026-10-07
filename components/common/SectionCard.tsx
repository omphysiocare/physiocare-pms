import { Box, Card, Divider, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface SectionCardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  /** Removes body padding, e.g. for embedded tables. */
  disablePadding?: boolean;
}

export default function SectionCard({ title, subtitle, icon, action, children, disablePadding }: SectionCardProps) {
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {(title || action) && (
        <>
          <Box sx={{ px: 2.5, py: 2, display: "flex", alignItems: "center", gap: 1.5, minHeight: 60 }}>
            {icon && <Box sx={{ color: "primary.main", display: "flex", "& svg": { fontSize: 20 } }}>{icon}</Box>}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {title && (
                <Typography variant="subtitle1" component="h2">
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography variant="caption" color="text.secondary" component="p">
                  {subtitle}
                </Typography>
              )}
            </Box>
            {action}
          </Box>
          <Divider />
        </>
      )}
      <Box sx={{ flex: 1, ...(disablePadding ? {} : { p: 2.5 }) }}>{children}</Box>
    </Card>
  );
}

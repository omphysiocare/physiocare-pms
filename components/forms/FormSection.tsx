import { Box, Card, Divider, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface FormSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  columns?: 1 | 2 | 3;
  action?: ReactNode;
}

/** Titled card with a responsive field grid. Use `FieldSpan` for full-width fields. */
export default function FormSection({ title, description, icon, children, columns = 2, action }: FormSectionProps) {
  return (
    <Card>
      <Box sx={{ px: 2.5, py: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
        {icon && <Box sx={{ color: "primary.main", display: "flex", "& svg": { fontSize: 20 } }}>{icon}</Box>}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" component="h2">
            {title}
          </Typography>
          {description && (
            <Typography variant="caption" color="text.secondary" component="p">
              {description}
            </Typography>
          )}
        </Box>
        {action}
      </Box>
      <Divider />
      <Box
        sx={{
          p: 2.5,
          display: "grid",
          gap: 2.5,
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: `repeat(${Math.min(columns, 2)}, minmax(0, 1fr))`,
            lg: `repeat(${columns}, minmax(0, 1fr))`,
          },
        }}
      >
        {children}
      </Box>
    </Card>
  );
}

export function FieldSpan({ children }: { children: ReactNode }) {
  return <Box sx={{ gridColumn: "1 / -1" }}>{children}</Box>;
}

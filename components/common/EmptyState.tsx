import { InboxOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}

export default function EmptyState({ title, description, icon, action, compact }: EmptyStateProps) {
  return (
    <Box sx={{ textAlign: "center", py: compact ? 4 : 7, px: 2 }}>
      <Box
        sx={{
          width: compact ? 44 : 56,
          height: compact ? 44 : 56,
          mx: "auto",
          mb: 2,
          borderRadius: "50%",
          bgcolor: "grey.100",
          color: "text.secondary",
          display: "grid",
          placeItems: "center",
        }}
      >
        {icon ?? <InboxOutlined />}
      </Box>
      <Typography variant="subtitle1">{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 420, mx: "auto" }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2.5 }}>{action}</Box>}
    </Box>
  );
}

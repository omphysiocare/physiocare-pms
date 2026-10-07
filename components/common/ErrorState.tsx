import { ErrorOutlined, Refresh } from "@mui/icons-material";
import { Box, Button, Card, Typography } from "@mui/material";

import { getErrorMessage } from "@/lib/api/errors";

interface ErrorStateProps {
  error: unknown;
  title?: string;
  onRetry?: () => void;
}

export default function ErrorState({ error, title = "Something went wrong", onRetry }: ErrorStateProps) {
  return (
    <Card>
      <Box sx={{ textAlign: "center", py: 7, px: 2 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            mx: "auto",
            mb: 2,
            borderRadius: "50%",
            bgcolor: "#FEF2F2",
            color: "error.main",
            display: "grid",
            placeItems: "center",
          }}
        >
          <ErrorOutlined />
        </Box>
        <Typography variant="subtitle1">{title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {getErrorMessage(error)}
        </Typography>
        {onRetry && (
          <Button variant="outlined" startIcon={<Refresh />} onClick={onRetry} sx={{ mt: 2.5 }}>
            Try again
          </Button>
        )}
      </Box>
    </Card>
  );
}

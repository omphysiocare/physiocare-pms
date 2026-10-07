import { Box, Card, Skeleton, Stack } from "@mui/material";

interface LoadingStateProps {
  variant?: "detail" | "form" | "list";
}

/** Page-level skeletons that mirror the layout being loaded. */
export default function LoadingState({ variant = "detail" }: LoadingStateProps) {
  if (variant === "form") {
    return (
      <Stack spacing={3} aria-busy="true" aria-label="Loading">
        {[0, 1].map((card) => (
          <Card key={card} sx={{ p: 2.5 }}>
            <Skeleton width={180} height={28} sx={{ mb: 2 }} />
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} variant="rounded" height={40} />
              ))}
            </Box>
          </Card>
        ))}
      </Stack>
    );
  }

  if (variant === "list") {
    return (
      <Card aria-busy="true" aria-label="Loading">
        {Array.from({ length: 8 }).map((_, index) => (
          <Box key={index} sx={{ px: 2.5, py: 1.75, borderBottom: 1, borderColor: "divider" }}>
            <Skeleton height={24} />
          </Box>
        ))}
      </Card>
    );
  }

  return (
    <Stack spacing={3} aria-busy="true" aria-label="Loading">
      <Card sx={{ p: 3, display: "flex", gap: 2, alignItems: "center" }}>
        <Skeleton variant="circular" width={64} height={64} />
        <Box sx={{ flex: 1 }}>
          <Skeleton width="40%" height={32} />
          <Skeleton width="60%" />
        </Box>
      </Card>
      <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" } }}>
        <Card sx={{ p: 2.5 }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} height={28} />
          ))}
        </Card>
        <Card sx={{ p: 2.5 }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} height={28} />
          ))}
        </Card>
      </Box>
    </Stack>
  );
}

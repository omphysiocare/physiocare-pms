import { ArrowBack } from "@mui/icons-material";
import { Box, Button, Stack, Typography } from "@mui/material";
import Link from "next/link";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Renders a back link above the title. */
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, description, backHref, backLabel = "Back", actions }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 3 }}>
      {backHref && (
        <Button
          component={Link}
          href={backHref}
          size="small"
          startIcon={<ArrowBack fontSize="small" />}
          sx={{ mb: 1.5, ml: -1, color: "text.secondary", "&:hover": { color: "text.primary" } }}
        >
          {backLabel}
        </Button>
      )}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", sm: "flex-start" } }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" component="h1" sx={{ fontSize: { xs: 22, sm: 26 } }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          )}
        </Box>
        {actions && (
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ flexWrap: "wrap", flexShrink: 0, "& > *": { flex: { xs: "1 1 auto", sm: "0 0 auto" } } }}
          >
            {actions}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}

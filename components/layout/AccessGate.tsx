"use client";

import { LockOutlined } from "@mui/icons-material";
import { Box, Button, Card, CircularProgress } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import EmptyState from "@/components/common/EmptyState";
import { routePermission } from "@/lib/navigation";
import { useAuth } from "@/providers/AuthProvider";

/** Waits for the session and blocks routes the member cannot access. */
export default function AccessGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { ready, can } = useAuth();

  if (!ready) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: "50vh" }} aria-busy="true">
        <CircularProgress size={32} />
      </Box>
    );
  }

  const permission = routePermission(pathname);
  if (permission && !can(permission)) {
    return (
      <Card>
        <EmptyState
          icon={<LockOutlined />}
          title="You don't have access to this page"
          description={`Your role is missing the "${permission}" permission. Ask a clinic owner or admin to update your permissions.`}
          action={
            <Button component={Link} href="/dashboard" variant="contained">
              Go to dashboard
            </Button>
          }
        />
      </Card>
    );
  }
  return <>{children}</>;
}

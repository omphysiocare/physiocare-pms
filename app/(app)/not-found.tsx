"use client";

import { SearchOff } from "@mui/icons-material";
import { Button, Card } from "@mui/material";
import Link from "next/link";

import EmptyState from "@/components/common/EmptyState";

export default function AppNotFound() {
  return (
    <Card>
      <EmptyState
        icon={<SearchOff />}
        title="Page not found"
        description="The page you are looking for doesn't exist or has been moved."
        action={
          <Button component={Link} href="/dashboard" variant="contained">
            Go to dashboard
          </Button>
        }
      />
    </Card>
  );
}

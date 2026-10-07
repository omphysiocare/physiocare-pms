"use client";

import { SearchOff } from "@mui/icons-material";
import { Button, Card } from "@mui/material";
import type { UseQueryResult } from "@tanstack/react-query";
import Link from "next/link";
import type { ReactNode } from "react";

import { isNotFound } from "@/lib/api/errors";

import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";
import LoadingState from "./LoadingState";

interface QueryBoundaryProps<T> {
  query: UseQueryResult<T>;
  /** Used in the not-found message, e.g. "Patient". */
  resource: string;
  backHref: string;
  loadingVariant?: "detail" | "form" | "list";
  children: (data: T) => ReactNode;
}

/** Renders loading, not-found and error states for a single-record query. */
export default function QueryBoundary<T>({ query, resource, backHref, loadingVariant, children }: QueryBoundaryProps<T>) {
  if (query.isPending) return <LoadingState variant={loadingVariant} />;

  if (query.isError) {
    if (isNotFound(query.error)) {
      return (
        <Card>
          <EmptyState
            icon={<SearchOff />}
            title={`${resource} not found`}
            description={`The ${resource.toLowerCase()} you are looking for does not exist or may have been deleted.`}
            action={
              <Button component={Link} href={backHref} variant="contained">
                Go back
              </Button>
            }
          />
        </Card>
      );
    }
    return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  }

  return <>{children(query.data)}</>;
}

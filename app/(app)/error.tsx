"use client";

import { useEffect } from "react";

import ErrorState from "@/components/common/ErrorState";

export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorState error={error} title="This page failed to load" onRetry={retry} />;
}

"use client";

import { useQuery } from "@tanstack/react-query";

import { useBranch } from "@/providers/BranchProvider";
import { activityService } from "@/services/activityService";
import { dashboardService } from "@/services/dashboardService";
import { reportService } from "@/services/reportService";
import { searchService } from "@/services/searchService";
import type { ReportFilters, ReportSlug } from "@/types";

export function useDashboardSummary() {
  const { branchId } = useBranch();
  return useQuery({ queryKey: ["dashboard", branchId], queryFn: () => dashboardService.getSummary({ branchId }) });
}

export function useReport(slug: ReportSlug, filters: ReportFilters) {
  return useQuery({
    queryKey: ["reports", slug, filters],
    queryFn: () => reportService.getReport(slug, filters),
    placeholderData: (previous) => (previous?.slug === slug ? previous : undefined),
  });
}

export function useActivity(recordId?: string, limit?: number) {
  return useQuery({ queryKey: ["activity", recordId, limit], queryFn: () => activityService.list({ recordId, limit }) });
}

export function useGlobalSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ["search", trimmed],
    queryFn: () => searchService.search(trimmed),
    enabled: trimmed.length >= 2,
    placeholderData: (previous) => previous,
  });
}

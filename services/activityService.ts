import { http } from "@/lib/api/client";
import { isMockApi } from "@/lib/api/config";
import { getDb } from "@/lib/api/mock/db";
import { run } from "@/lib/api/mock/run";
import type { ActivityLog } from "@/types";

export interface ActivityFilters {
  recordId?: string;
  limit?: number;
}

export interface ActivityService {
  list(filters?: ActivityFilters): Promise<ActivityLog[]>;
}

const mockActivityService: ActivityService = {
  list: (filters) =>
    run(() =>
      getDb()
        .activity.filter((log) => !filters?.recordId || log.recordId === filters.recordId)
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, filters?.limit ?? 200),
    ),
};

const httpActivityService: ActivityService = {
  list: (filters) => http.get<ActivityLog[]>("/activity", filters),
};

export const activityService = isMockApi ? mockActivityService : httpActivityService;

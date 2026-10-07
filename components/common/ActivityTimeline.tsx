"use client";

import { HistoryOutlined } from "@mui/icons-material";
import { Box, Skeleton, Typography } from "@mui/material";

import { useActivity } from "@/hooks/useInsights";
import { formatDateTime } from "@/lib/format";

import EmptyState from "./EmptyState";

/** Audit trail for a single record (who did what, when). */
export default function ActivityTimeline({ recordId, limit = 20 }: { recordId: string; limit?: number }) {
  const { data = [], isPending } = useActivity(recordId, limit);
  if (isPending) return <Skeleton variant="rounded" height={60} sx={{ m: 2 }} />;
  if (data.length === 0) return <EmptyState compact icon={<HistoryOutlined />} title="No recorded activity" />;
  return (
    <Box component="ol" sx={{ listStyle: "none", m: 0, px: 2.5, py: 1.5 }}>
      {data.map((log) => (
        <Box component="li" key={log.id} sx={{ py: 1, borderBottom: 1, borderColor: "divider", "&:last-child": { borderBottom: 0 } }}>
          <Typography variant="body2">{log.description}</Typography>
          <Typography variant="caption" color="text.secondary">
            {formatDateTime(log.at)} · {log.memberName}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

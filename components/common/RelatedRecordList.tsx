import { ChevronRight } from "@mui/icons-material";
import { Box, List, ListItemButton, Typography } from "@mui/material";
import Link from "next/link";
import type { ReactNode } from "react";

import StatusChip from "./StatusChip";

export interface RelatedRecord {
  id: string;
  href: string;
  title: ReactNode;
  subtitle?: ReactNode;
  status?: string;
  icon?: ReactNode;
}

/** List of linked records (consultation, treatment, invoice…) on detail pages. */
export default function RelatedRecordList({ records, emptyText }: { records: RelatedRecord[]; emptyText: string }) {
  if (records.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ px: 2.5, py: 3 }}>
        {emptyText}
      </Typography>
    );
  }
  return (
    <List sx={{ p: 1 }}>
      {records.map((record) => (
        <ListItemButton key={record.id} component={Link} href={record.href} sx={{ borderRadius: 2, gap: 1.5 }}>
          {record.icon && <Box sx={{ color: "primary.main", display: "flex", "& svg": { fontSize: 20 } }}>{record.icon}</Box>}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {record.title}
            </Typography>
            {record.subtitle && (
              <Typography variant="caption" color="text.secondary" noWrap component="p">
                {record.subtitle}
              </Typography>
            )}
          </Box>
          {record.status && <StatusChip status={record.status} />}
          <ChevronRight sx={{ color: "text.secondary", fontSize: 18 }} />
        </ListItemButton>
      ))}
    </List>
  );
}

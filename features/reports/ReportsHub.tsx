"use client";

import {
  AccountBalanceOutlined,
  AccountBalanceWalletOutlined,
  CalendarMonthOutlined,
  CampaignOutlined,
  ChevronRight,
  GroupsOutlined,
  HistoryOutlined,
  MedicalInformationOutlined,
  PaymentsOutlined,
  PendingActionsOutlined,
  PeopleAltOutlined,
  SelfImprovementOutlined,
  StorefrontOutlined,
  TodayOutlined,
  TrendingUpOutlined,
} from "@mui/icons-material";
import { Box, Card, CardActionArea, Typography } from "@mui/material";
import Link from "next/link";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/common";
import { REPORT_DEFINITIONS } from "@/lib/reports/definitions";
import { useAuth } from "@/providers/AuthProvider";
import { TONES } from "@/theme/tones";
import type { ReportSlug } from "@/types";

export const REPORT_ICONS: Record<ReportSlug, ReactNode> = {
  daily: <TodayOutlined />,
  patients: <PeopleAltOutlined />,
  appointments: <CalendarMonthOutlined />,
  consultations: <MedicalInformationOutlined />,
  services: <SelfImprovementOutlined />,
  payments: <PaymentsOutlined />,
  revenue: <TrendingUpOutlined />,
  expenses: <AccountBalanceWalletOutlined />,
  "profit-loss": <AccountBalanceOutlined />,
  members: <GroupsOutlined />,
  referrals: <CampaignOutlined />,
  branches: <StorefrontOutlined />,
  outstanding: <PendingActionsOutlined />,
  activity: <HistoryOutlined />,
};

const GROUP_TONES = { Operations: "primary", Clinical: "secondary", Finance: "success", "Team & Growth": "info", Compliance: "neutral" } as const;

export default function ReportsHub() {
  const { can } = useAuth();
  const groups = Array.from(new Set(REPORT_DEFINITIONS.map((d) => d.group)));
  return (
    <>
      <PageHeader title="Reports" description="Separate, filterable reports with print, PDF and CSV export." />
      {groups.map((group) => (
        <Box key={group} sx={{ mb: 3 }}>
          <Typography variant="overline" color="text.secondary">{group}</Typography>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" } }}>
            {REPORT_DEFINITIONS.filter((d) => d.group === group && (d.slug !== "activity" || can("audit.view"))).map((definition) => {
              const tone = TONES[GROUP_TONES[definition.group]];
              return (
                <Card key={definition.slug}>
                  <CardActionArea component={Link} href={`/reports/${definition.slug}`} sx={{ p: 2.5, display: "flex", alignItems: "flex-start", gap: 2, height: "100%" }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: tone.bg, color: tone.fg, display: "grid", placeItems: "center", flexShrink: 0 }}>{REPORT_ICONS[definition.slug]}</Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1">{definition.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{definition.description}</Typography>
                    </Box>
                    <ChevronRight color="action" />
                  </CardActionArea>
                </Card>
              );
            })}
          </Box>
        </Box>
      ))}
    </>
  );
}

"use client";

import { EventAvailableOutlined, EventRepeatOutlined, NotificationsNoneOutlined, ReceiptLongOutlined, ScheduleOutlined } from "@mui/icons-material";
import { Badge, Box, Button, Divider, IconButton, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";

import { useDashboardSummary } from "@/hooks/useInsights";
import { formatCurrency, formatTime } from "@/lib/format";
import { colors } from "@/theme/theme";

interface NotificationItem {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
}

export default function NotificationsMenu() {
  const router = useRouter();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [readIds, setReadIds] = useState<string[]>([]);
  const { data } = useDashboardSummary();

  const items = useMemo<NotificationItem[]>(() => {
    if (!data) return [];
    const list: NotificationItem[] = [];
    const next = data.upcomingAppointments[0];
    if (next) list.push({ id: `next-${next.id}`, icon: <ScheduleOutlined fontSize="small" color="primary" />, title: `Next: ${next.patient.name}`, description: `${next.type} at ${formatTime(next.startTime)} with ${next.provider.name}`, href: `/appointments/${next.id}` });
    if (data.appointments.today > 0) list.push({ id: `today-${data.appointments.today}`, icon: <EventAvailableOutlined fontSize="small" color="secondary" />, title: `${data.appointments.today} appointments today`, description: "Open the day view", href: "/appointments?view=day" });
    if (data.followUpsDue > 0) list.push({ id: `fu-${data.followUpsDue}`, icon: <EventRepeatOutlined fontSize="small" color="info" />, title: `${data.followUpsDue} follow-ups due this week`, description: "Send follow-up reminders on WhatsApp", href: "/consultations" });
    if (data.pendingPayments.invoices > 0) list.push({ id: `dues-${data.pendingPayments.invoices}`, icon: <ReceiptLongOutlined fontSize="small" color="warning" />, title: `${data.pendingPayments.invoices} invoices awaiting payment`, description: `${formatCurrency(data.pendingPayments.amount)} outstanding`, href: "/reports/outstanding" });
    return list;
  }, [data]);

  const unread = items.filter((item) => !readIds.includes(item.id)).length;

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton onClick={(event) => setAnchor(event.currentTarget)} aria-label={`Notifications, ${unread} unread`}>
          <Badge badgeContent={unread} color="error" max={9}>
            <NotificationsNoneOutlined />
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }} slotProps={{ paper: { sx: { width: 340, maxWidth: "calc(100vw - 32px)" } } }}>
        <Box sx={{ px: 2, py: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="subtitle2">Notifications</Typography>
          <Button size="small" disabled={unread === 0} onClick={() => setReadIds(items.map((item) => item.id))}>
            Mark all read
          </Button>
        </Box>
        <Divider />
        {items.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 3, textAlign: "center" }}>
            You&apos;re all caught up.
          </Typography>
        )}
        {items.map((item) => (
          <MenuItem
            key={item.id}
            onClick={() => {
              setReadIds((ids) => [...ids, item.id]);
              setAnchor(null);
              router.push(item.href);
            }}
            sx={{ alignItems: "flex-start", py: 1.25, whiteSpace: "normal", bgcolor: readIds.includes(item.id) ? undefined : colors.primaryLight }}
          >
            <Box sx={{ mt: 0.25 }}>{item.icon}</Box>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {item.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {item.description}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

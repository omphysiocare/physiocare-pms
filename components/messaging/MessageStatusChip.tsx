import { DoneAllOutlined, DoneOutlined, ErrorOutlined, ScheduleOutlined } from "@mui/icons-material";
import { Chip } from "@mui/material";

import { TONES } from "@/theme/tones";
import type { MessageStatus } from "@/types";

const META: Record<MessageStatus, { label: string; tone: keyof typeof TONES; icon: React.ReactElement }> = {
  queued: { label: "Queued", tone: "neutral", icon: <ScheduleOutlined /> },
  sent: { label: "Sent", tone: "info", icon: <DoneOutlined /> },
  delivered: { label: "Delivered", tone: "primary", icon: <DoneAllOutlined /> },
  read: { label: "Read", tone: "success", icon: <DoneAllOutlined /> },
  failed: { label: "Failed", tone: "error", icon: <ErrorOutlined /> },
};

export default function MessageStatusChip({ status }: { status: MessageStatus }) {
  const meta = META[status];
  const tone = TONES[meta.tone];
  return (
    <Chip
      size="small"
      icon={meta.icon}
      label={meta.label}
      sx={{ bgcolor: tone.bg, color: tone.fg, "& .MuiChip-icon": { color: tone.fg, fontSize: 14 } }}
    />
  );
}

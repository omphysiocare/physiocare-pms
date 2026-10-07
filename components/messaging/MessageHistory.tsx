"use client";

import { AttachFileOutlined } from "@mui/icons-material";
import { Box, Skeleton, Typography } from "@mui/material";

import EmptyState from "@/components/common/EmptyState";
import { useMessages } from "@/hooks/useMessaging";
import { formatDateTime } from "@/lib/format";
import { MESSAGE_TYPE_LABELS } from "@/lib/messaging/templates";
import type { MessageFilters } from "@/services/whatsappService";

import MessageStatusChip from "./MessageStatusChip";
import WhatsAppIcon from "./WhatsAppIcon";

/** Communication history for a patient, appointment, invoice… */
export default function MessageHistory({ filters, compact }: { filters: MessageFilters; compact?: boolean }) {
  const { data: messages = [], isPending } = useMessages(filters);

  if (isPending) return <Skeleton variant="rounded" height={80} sx={{ m: 2 }} />;
  if (messages.length === 0) {
    return <EmptyState compact icon={<WhatsAppIcon />} title="No messages yet" description="WhatsApp messages sent to the patient will appear here." />;
  }
  return (
    <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
      {messages.slice(0, compact ? 5 : 50).map((message) => (
        <Box component="li" key={message.id} sx={{ px: 2.5, py: 1.75, borderBottom: 1, borderColor: "divider", "&:last-child": { borderBottom: 0 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <WhatsAppIcon fontSize="small" sx={{ color: "#128C7E" }} />
            <Typography variant="body2" sx={{ fontWeight: 600, flex: 1, minWidth: 0 }}>
              {MESSAGE_TYPE_LABELS[message.type]}
            </Typography>
            <MessageStatusChip status={message.status} />
          </Box>
          <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.25 }}>
            {formatDateTime(message.sentAt)} · {message.sentByName} · to {message.to}
          </Typography>
          {message.error && (
            <Typography variant="caption" color="error.main" component="p">
              {message.error}
            </Typography>
          )}
          {!compact && (
            <Typography variant="body2" sx={{ mt: 1, p: 1.5, bgcolor: "#F0FDF4", borderRadius: 2, whiteSpace: "pre-line", fontSize: 13 }}>
              {message.body}
            </Typography>
          )}
          {message.attachment && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
              <AttachFileOutlined sx={{ fontSize: 14 }} /> {message.attachment.fileName} ({Math.round(message.attachment.size / 1024)} KB)
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
}

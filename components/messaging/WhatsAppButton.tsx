"use client";

import { ArrowDropDown, OpenInNewOutlined, SendOutlined } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Menu,
  MenuItem,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

import { useMessagePreview, useSendWhatsApp } from "@/hooks/useMessaging";
import { formatRelativeTime } from "@/lib/format";
import { MESSAGE_TYPE_LABELS, whatsappDeepLink } from "@/lib/messaging/templates";
import { useAuth } from "@/providers/AuthProvider";
import { useNotify } from "@/providers/NotificationProvider";
import type { MessageRelatedType, MessageSummary, MessageType } from "@/types";

import MessageStatusChip from "./MessageStatusChip";
import WhatsAppIcon from "./WhatsAppIcon";

const WHATSAPP_GREEN = "#128C7E";

interface WhatsAppButtonProps {
  patientId: string;
  relatedType: MessageRelatedType;
  relatedId: string;
  /** Sent with one click. */
  defaultType: MessageType;
  /** Other message types offered in the dropdown. */
  types?: MessageType[];
  /** For receipts: the invoice the payment belongs to. */
  invoiceId?: string;
  lastMessage?: MessageSummary | null;
  label?: string;
  size?: "small" | "medium";
  fullWidth?: boolean;
  hideLastSent?: boolean;
}

function PreviewDialog({
  type,
  props,
  onClose,
}: {
  type: MessageType;
  props: WhatsAppButtonProps;
  onClose: () => void;
}) {
  const notify = useNotify();
  const preview = useMessagePreview(type, props.relatedType, props.relatedId);
  const send = useSendWhatsApp();
  const [body, setBody] = useState<string | null>(null);
  const text = body ?? preview.data?.body ?? "";
  const needsPdf = type === "invoice" || type === "payment_receipt" || type === "prescription";

  const submit = async () => {
    try {
      await send.mutateAsync({ type, relatedType: props.relatedType, relatedId: props.relatedId, patientId: props.patientId, invoiceId: props.invoiceId, body: text });
      notify.success(`${MESSAGE_TYPE_LABELS[type]} sent on WhatsApp`);
      onClose();
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <Dialog open onClose={send.isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <WhatsAppIcon sx={{ color: WHATSAPP_GREEN }} /> {MESSAGE_TYPE_LABELS[type]}
      </DialogTitle>
      <DialogContent>
        {preview.isPending ? (
          <Skeleton variant="rounded" height={180} />
        ) : preview.data ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              To <strong>{preview.data.patientName}</strong> · {preview.data.to}
              {needsPdf && " · branded PDF attached"}
            </Typography>
            {!preview.data.canSend && (
              <Alert severity="warning" sx={{ mb: 1.5 }}>
                {preview.data.blockedReason}
              </Alert>
            )}
            <TextField multiline minRows={8} value={text} onChange={(event) => setBody(event.target.value)} label="Message" slotProps={{ htmlInput: { "aria-label": "Message text" } }} />
          </>
        ) : (
          <Alert severity="error">Could not prepare this message.</Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, flexWrap: "wrap", gap: 1 }}>
        {preview.data && (
          <Button href={whatsappDeepLink(preview.data.to, text)} target="_blank" rel="noopener" startIcon={<OpenInNewOutlined />} sx={{ mr: "auto" }}>
            Open in WhatsApp
          </Button>
        )}
        <Button color="inherit" onClick={onClose} disabled={send.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={submit}
          loading={send.isPending}
          disabled={!preview.data?.canSend}
          startIcon={<SendOutlined />}
          sx={{ bgcolor: WHATSAPP_GREEN, "&:hover": { bgcolor: "#0b6e63" } }}
        >
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Last message line shown under WhatsApp buttons. */
export function LastMessageInfo({ message }: { message: MessageSummary | null | undefined }) {
  if (!message) return null;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mt: 0.75 }}>
      <Typography variant="caption" color="text.secondary">
        Last sent: {MESSAGE_TYPE_LABELS[message.type]} · {formatRelativeTime(message.sentAt)} by {message.sentByName}
      </Typography>
      <MessageStatusChip status={message.status} />
    </Box>
  );
}

/**
 * One-click WhatsApp action: the main button sends the default message
 * immediately; the dropdown lets the user pick another type and edit it first.
 */
export default function WhatsAppButton(props: WhatsAppButtonProps) {
  const { defaultType, types = [], lastMessage, label = "Send WhatsApp", size = "medium", fullWidth, hideLastSent } = props;
  const { can } = useAuth();
  const notify = useNotify();
  const send = useSendWhatsApp();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [previewType, setPreviewType] = useState<MessageType | null>(null);

  if (!can("messaging.send")) return null;

  const sendNow = async () => {
    try {
      const message = await send.mutateAsync({ type: defaultType, relatedType: props.relatedType, relatedId: props.relatedId, patientId: props.patientId, invoiceId: props.invoiceId });
      notify.success(`${MESSAGE_TYPE_LABELS[defaultType]} sent on WhatsApp to ${message.to}`);
    } catch (error) {
      notify.error(error);
    }
  };

  const options = Array.from(new Set([defaultType, ...types]));

  return (
    <Box sx={{ width: fullWidth ? "100%" : undefined }}>
      <ButtonGroup variant="contained" size={size} fullWidth={fullWidth} disableElevation sx={{ maxWidth: "100%", width: fullWidth ? "100%" : undefined, "& .MuiButton-root": { bgcolor: WHATSAPP_GREEN, borderColor: "#0b6e63 !important", "&:hover": { bgcolor: "#0b6e63" } } }}>
        <Button onClick={sendNow} loading={send.isPending} loadingPosition="start" startIcon={<WhatsAppIcon />} sx={{ flex: 1, minWidth: 0, whiteSpace: "normal", lineHeight: 1.25, textAlign: "left" }}>
          {send.isPending ? "Sending…" : label}
        </Button>
        <Button size="small" aria-label="More WhatsApp messages" onClick={(event) => setAnchor(event.currentTarget)} disabled={send.isPending} sx={{ flex: "0 0 auto", px: 0.5, minWidth: 36 }}>
          <ArrowDropDown />
        </Button>
      </ButtonGroup>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
        <Typography variant="overline" color="text.secondary" sx={{ px: 2, display: "block" }}>
          Preview & send
        </Typography>
        {options.map((type) => (
          <MenuItem
            key={type}
            onClick={() => {
              setAnchor(null);
              setPreviewType(type);
            }}
          >
            <WhatsAppIcon fontSize="small" sx={{ color: WHATSAPP_GREEN }} />
            {MESSAGE_TYPE_LABELS[type]}
          </MenuItem>
        ))}
      </Menu>
      {!hideLastSent && <LastMessageInfo message={lastMessage} />}
      {previewType && <PreviewDialog type={previewType} props={props} onClose={() => setPreviewType(null)} />}
    </Box>
  );
}

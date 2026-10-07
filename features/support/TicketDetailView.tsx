"use client";

import { SendOutlined } from "@mui/icons-material";
import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import { useState } from "react";

import { DetailLayout, PageHeader, PersonAvatar, QueryBoundary, SectionCard, StatusChip, SummaryList } from "@/components/common";
import { useReplyTicket, useTicket, useUpdateTicket } from "@/hooks/useAccount";
import { formatDateTime } from "@/lib/format";
import { useNotify } from "@/providers/NotificationProvider";
import { TICKET_PRIORITIES, TICKET_STATUSES, type SupportTicket, type TicketPriority, type TicketStatus } from "@/types";

function Ticket({ ticket }: { ticket: SupportTicket }) {
  const notify = useNotify();
  const reply = useReplyTicket(ticket.id);
  const update = useUpdateTicket(ticket.id);
  const [text, setText] = useState("");
  const send = async () => {
    if (!text.trim()) return;
    try {
      await reply.mutateAsync(text.trim());
      setText("");
      notify.success("Reply sent");
    } catch (error) {
      notify.error(error);
    }
  };
  const change = (patch: { status?: TicketStatus; priority?: TicketPriority }) => update.mutate(patch, { onSuccess: () => notify.success("Ticket updated"), onError: notify.error });

  return (
    <>
      <PageHeader title={ticket.subject} description={`${ticket.id} · ${ticket.category} · opened ${formatDateTime(ticket.createdAt)}`} backHref="/support" backLabel="Support" />
      <DetailLayout
        main={
          <SectionCard title="Conversation" disablePadding>
            {ticket.messages.map((m) => (
              <Box key={m.id} sx={{ display: "flex", gap: 1.5, px: 2.5, py: 2, borderBottom: 1, borderColor: "divider", bgcolor: m.author.type === "support" ? "#F0F9FF" : undefined }}>
                <PersonAvatar name={m.author.name} size={34} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{m.author.name}{m.author.type === "support" && " · Support team"}</Typography>
                  <Typography variant="caption" color="text.secondary">{formatDateTime(m.at)}</Typography>
                  <Typography variant="body2" sx={{ mt: 0.75, whiteSpace: "pre-line" }}>{m.body}</Typography>
                </Box>
              </Box>
            ))}
            <Box sx={{ p: 2, display: "flex", gap: 1.5, flexDirection: { xs: "column", sm: "row" } }}>
              <TextField multiline minRows={3} placeholder="Write a reply…" value={text} onChange={(e) => setText(e.target.value)} slotProps={{ htmlInput: { "aria-label": "Reply" } }} />
              <Button variant="contained" startIcon={<SendOutlined />} onClick={send} loading={reply.isPending} disabled={!text.trim()} sx={{ alignSelf: { sm: "flex-end" } }}>Send</Button>
            </Box>
          </SectionCard>
        }
        aside={
          <>
            <SectionCard title="Ticket">
              <SummaryList rows={[{ label: "Status", value: <StatusChip status={ticket.status} /> }, { label: "Priority", value: ticket.priority }, { label: "Opened by", value: ticket.createdByName }, { label: "Last update", value: formatDateTime(ticket.updatedAt) }]} />
              <TextField select label="Status" value={ticket.status} onChange={(e) => change({ status: e.target.value as TicketStatus })} sx={{ mt: 2 }}>
                {TICKET_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
              <TextField select label="Priority" value={ticket.priority} onChange={(e) => change({ priority: e.target.value as TicketPriority })} sx={{ mt: 2 }}>
                {TICKET_PRIORITIES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </TextField>
            </SectionCard>
            <SectionCard title="History">
              {[...ticket.history].reverse().map((h, index) => (
                <Box key={index} sx={{ py: 0.75, borderBottom: 1, borderColor: "divider" }}>
                  <Typography variant="body2">{h.text}</Typography>
                  <Typography variant="caption" color="text.secondary">{formatDateTime(h.at)}</Typography>
                </Box>
              ))}
            </SectionCard>
          </>
        }
      />
    </>
  );
}

export default function TicketDetailView({ id }: { id: string }) {
  const query = useTicket(id);
  return <QueryBoundary query={query} resource="Ticket" backHref="/support">{(ticket) => <Ticket ticket={ticket} />}</QueryBoundary>;
}

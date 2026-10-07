"use client";

import { Add, SupportAgentOutlined } from "@mui/icons-material";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DataTable, EmptyState, FilterBar, FilterSelect, IdLink, PageHeader, StatCard, StatGrid, StatusChip, type Column } from "@/components/common";
import { FormTextField } from "@/components/forms";
import { useCreateTicket, useTickets } from "@/hooks/useAccount";
import { formatDateTime } from "@/lib/format";
import { matchesSearch } from "@/lib/search";
import { requiredText, selectOne } from "@/lib/validation";
import { useNotify } from "@/providers/NotificationProvider";
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES, type SupportTicket } from "@/types";

const schema = z.object({
  subject: requiredText("Subject", 150),
  category: selectOne(TICKET_CATEGORIES, "Category"),
  priority: selectOne(TICKET_PRIORITIES, "Priority"),
  message: requiredText("Message", 3000),
});
type Values = z.infer<typeof schema>;

function NewTicketDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const notify = useNotify();
  const create = useCreateTicket();
  const { control, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { subject: "", category: "Technical issue", priority: "Medium", message: "" } });
  const submit = async (values: Values) => {
    try {
      const ticket = await create.mutateAsync(values);
      notify.success(`Ticket ${ticket.id} created — our team usually replies within 4 working hours`);
      router.push(`/support/${ticket.id}`);
    } catch (error) {
      notify.error(error);
    }
  };
  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <form noValidate onSubmit={handleSubmit(submit)}>
        <DialogTitle>New support ticket</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormTextField control={control} name="subject" label="Subject" required autoFocus />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormTextField control={control} name="category" label="Category" options={TICKET_CATEGORIES} />
              <FormTextField control={control} name="priority" label="Priority" options={TICKET_PRIORITIES} />
            </Stack>
            <FormTextField control={control} name="message" label="Describe the issue" required multiline minRows={5} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" loading={formState.isSubmitting}>Submit ticket</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default function SupportView() {
  const router = useRouter();
  const { data: tickets = [], isPending } = useTickets();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const rows = useMemo(() => tickets.filter((t) => matchesSearch(search, t.id, t.subject, t.category) && (status === "all" || t.status === status)), [tickets, search, status]);
  const columns: Column<SupportTicket>[] = [
    { id: "id", label: "Ticket", render: (t) => <IdLink id={t.id} href={`/support/${t.id}`} />, sortValue: (t) => t.id },
    { id: "subject", label: "Subject", render: (t) => t.subject, sortValue: (t) => t.subject },
    { id: "category", label: "Category", render: (t) => t.category, hideBelow: "md" },
    { id: "priority", label: "Priority", render: (t) => <StatusChip status={t.priority === "Urgent" || t.priority === "High" ? "Pending" : "Scheduled"} label={t.priority} />, sortValue: (t) => TICKET_PRIORITIES.indexOf(t.priority), hideBelow: "sm" },
    { id: "updated", label: "Last update", render: (t) => formatDateTime(t.updatedAt), sortValue: (t) => t.updatedAt, hideBelow: "lg" },
    { id: "status", label: "Status", render: (t) => <StatusChip status={t.status} />, sortValue: (t) => t.status },
  ];
  return (
    <>
      <PageHeader title="Support" description="Raise and track tickets with the PMS support team." actions={<Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>New ticket</Button>} />
      <StatGrid>
        {TICKET_STATUSES.map((s, index) => <StatCard key={s} label={s} value={tickets.filter((t) => t.status === s).length} icon={<SupportAgentOutlined />} tone={(["info", "warning", "success", "neutral"] as const)[index]} loading={isPending} />)}
      </StatGrid>
      <DataTable
        columns={columns}
        rows={rows}
        loading={isPending}
        getRowId={(t) => t.id}
        onRowClick={(t) => router.push(`/support/${t.id}`)}
        initialSort={{ columnId: "updated", direction: "desc" }}
        toolbar={<FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search tickets"><FilterSelect label="Status" value={status} onChange={setStatus} options={[{ value: "all", label: "All statuses" }, ...TICKET_STATUSES.map((s) => ({ value: s, label: s }))]} /></FilterBar>}
        emptyState={<EmptyState title="No tickets" icon={<SupportAgentOutlined />} action={<Button onClick={() => setOpen(true)}>Open a ticket</Button>} />}
      />
      {open && <NewTicketDialog onClose={() => setOpen(false)} />}
    </>
  );
}

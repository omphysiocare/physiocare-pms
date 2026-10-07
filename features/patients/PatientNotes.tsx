"use client";

import { DeleteOutlined, StickyNote2Outlined } from "@mui/icons-material";
import { Box, Button, IconButton, Skeleton, TextField, Tooltip, Typography } from "@mui/material";
import { useState } from "react";

import { EmptyState } from "@/components/common";
import { useAddNote, useDeleteNote, usePatientNotes } from "@/hooks/usePatients";
import { formatDateTime } from "@/lib/format";
import { useAuth } from "@/providers/AuthProvider";
import { useNotify } from "@/providers/NotificationProvider";

/** Timestamped internal notes on a patient. */
export default function PatientNotes({ patientId }: { patientId: string }) {
  const { can, member } = useAuth();
  const notify = useNotify();
  const { data: notes = [], isPending } = usePatientNotes(patientId);
  const add = useAddNote(patientId);
  const remove = useDeleteNote(patientId);
  const [text, setText] = useState("");

  const submit = async () => {
    if (!text.trim()) return;
    try {
      await add.mutateAsync(text);
      setText("");
      notify.success("Note added");
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <Box>
      {can("patients.edit") && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider", display: "flex", gap: 1.5, alignItems: "flex-start", flexDirection: { xs: "column", sm: "row" } }}>
          <TextField multiline minRows={2} placeholder="Add a note (visible to the clinic team)…" value={text} onChange={(e) => setText(e.target.value)} slotProps={{ htmlInput: { maxLength: 1000, "aria-label": "New note" } }} />
          <Button variant="contained" onClick={submit} loading={add.isPending} disabled={!text.trim()} sx={{ flexShrink: 0 }}>Add note</Button>
        </Box>
      )}
      {isPending ? (
        <Skeleton variant="rounded" height={60} sx={{ m: 2 }} />
      ) : notes.length === 0 ? (
        <EmptyState compact icon={<StickyNote2Outlined />} title="No notes yet" />
      ) : (
        notes.map((note) => (
          <Box key={note.id} sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: "divider", display: "flex", gap: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>{note.text}</Typography>
              <Typography variant="caption" color="text.secondary">{formatDateTime(note.createdAt)} · {note.authorName}</Typography>
            </Box>
            {(note.authorId === member?.id || can("patients.delete")) && (
              <Tooltip title="Delete note">
                <IconButton size="small" onClick={() => remove.mutate(note.id, { onSuccess: () => notify.success("Note deleted"), onError: notify.error })} aria-label="Delete note">
                  <DeleteOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ))
      )}
    </Box>
  );
}

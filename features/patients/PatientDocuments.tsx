"use client";

import { DeleteOutlined, DescriptionOutlined, DownloadOutlined, UploadFileOutlined } from "@mui/icons-material";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Skeleton, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { useRef, useState } from "react";

import { EmptyState, useConfirm } from "@/components/common";
import { useDeleteDocument, usePatientDocuments, useUploadDocument } from "@/hooks/usePatients";
import { formatDateTime } from "@/lib/format";
import { useAuth } from "@/providers/AuthProvider";
import { useNotify } from "@/providers/NotificationProvider";
import { DOCUMENT_CATEGORIES, type DocumentCategory } from "@/types";

const MAX_SIZE = 10 * 1024 * 1024;

function sizeLabel(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

/** Patient documents: upload (reports, imaging, consent…), download and delete. */
export default function PatientDocuments({ patientId }: { patientId: string }) {
  const { can } = useAuth();
  const notify = useNotify();
  const { data: documents = [], isPending } = usePatientDocuments(patientId);
  const upload = useUploadDocument(patientId);
  const remove = useDeleteDocument(patientId);
  const { confirm, dialog } = useConfirm();
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ file: File; dataUrl: string | null } | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("Report");

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_SIZE) return notify.error("Files must be 10 MB or smaller.");
    const reader = new FileReader();
    reader.onload = () => setPending({ file, dataUrl: String(reader.result) });
    reader.onerror = () => setPending({ file, dataUrl: null });
    reader.readAsDataURL(file);
    setName(file.name.replace(/\.[^.]+$/, ""));
  };

  const save = async () => {
    if (!pending) return;
    try {
      await upload.mutateAsync({ name: name.trim() || pending.file.name, category, fileName: pending.file.name, mimeType: pending.file.type || "application/octet-stream", size: pending.file.size, dataUrl: pending.dataUrl });
      notify.success("Document uploaded");
      setPending(null);
    } catch (error) {
      notify.error(error);
    }
  };

  const download = (doc: (typeof documents)[number]) => {
    if (!doc.dataUrl) return notify.info("This file is stored on the server and will be downloadable once storage is connected.");
    const link = document.createElement("a");
    link.href = doc.dataUrl;
    link.download = doc.fileName;
    link.click();
  };

  return (
    <Box>
      {can("patients.edit") && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Button variant="outlined" startIcon={<UploadFileOutlined />} onClick={() => input.current?.click()}>
            Upload document
          </Button>
          <input ref={input} type="file" hidden onChange={(event) => { pick(event.target.files?.[0]); event.target.value = ""; }} />
        </Box>
      )}
      {isPending ? (
        <Skeleton variant="rounded" height={80} sx={{ m: 2 }} />
      ) : documents.length === 0 ? (
        <EmptyState compact icon={<DescriptionOutlined />} title="No documents" description="Upload reports, imaging, consent forms or ID proofs." />
      ) : (
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
          {documents.map((doc) => (
            <Box component="li" key={doc.id} sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2.5, py: 1.5, borderBottom: 1, borderColor: "divider" }}>
              <DescriptionOutlined color="primary" />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{doc.name}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap component="p">
                  {doc.category} · {doc.fileName} · {sizeLabel(doc.size)} · {formatDateTime(doc.uploadedAt)} by {doc.uploadedBy}
                </Typography>
              </Box>
              <Tooltip title="Download"><IconButton size="small" onClick={() => download(doc)} aria-label={`Download ${doc.name}`}><DownloadOutlined fontSize="small" /></IconButton></Tooltip>
              {can("patients.edit") && (
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    aria-label={`Delete ${doc.name}`}
                    onClick={async () => {
                      if (!(await confirm({ title: "Delete document?", description: `"${doc.name}" will be permanently removed.`, confirmLabel: "Delete", destructive: true }))) return;
                      remove.mutate(doc.id, { onSuccess: () => notify.success("Document deleted"), onError: notify.error });
                    }}
                  >
                    <DeleteOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          ))}
        </Box>
      )}
      <Dialog open={Boolean(pending)} onClose={() => setPending(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Upload document</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">{pending?.file.name} · {pending ? sizeLabel(pending.file.size) : ""}</Typography>
            <TextField label="Document name" value={name} onChange={(e) => setName(e.target.value)} />
            <TextField select label="Category" value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)}>
              {DOCUMENT_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={() => setPending(null)}>Cancel</Button>
          <Button variant="contained" onClick={save} loading={upload.isPending}>Upload</Button>
        </DialogActions>
      </Dialog>
      {dialog}
    </Box>
  );
}

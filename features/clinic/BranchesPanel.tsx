"use client";

import { Add, EditOutlined } from "@mui/icons-material";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Tooltip } from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DataTable, StatusChip, type Column } from "@/components/common";
import { FormSwitch, FormTextField } from "@/components/forms";
import { useBranches, useSaveBranch } from "@/hooks/useClinic";
import { today } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { isoDate, optionalEmail, requiredText } from "@/lib/validation";
import { useAuth } from "@/providers/AuthProvider";
import { useNotify } from "@/providers/NotificationProvider";
import type { Branch } from "@/types";

import SettingsCard from "./SettingsCard";

const schema = z.object({
  name: requiredText("Branch name", 80),
  code: z.string().trim().regex(/^[A-Z]{2,5}$/, "2–5 capital letters"),
  address: requiredText("Address", 200),
  city: requiredText("City", 60),
  phone: requiredText("Phone", 20),
  email: optionalEmail,
  isMain: z.boolean(),
  active: z.boolean(),
  openedOn: isoDate("Opened on"),
});
type BranchValues = z.infer<typeof schema>;

function BranchDialog({ branch, onClose }: { branch?: Branch; onClose: () => void }) {
  const notify = useNotify();
  const save = useSaveBranch();
  const { control, handleSubmit, formState } = useForm<BranchValues>({
    resolver: zodResolver(schema),
    defaultValues: branch ? { name: branch.name, code: branch.code, address: branch.address, city: branch.city, phone: branch.phone, email: branch.email, isMain: branch.isMain, active: branch.active, openedOn: branch.openedOn } : { name: "", code: "", address: "", city: "", phone: "", email: "", isMain: false, active: true, openedOn: today() },
  });
  const submit = async (values: BranchValues) => {
    try {
      await save.mutateAsync({ id: branch?.id, input: values });
      notify.success(branch ? "Branch updated" : "Branch added");
      onClose();
    } catch (error) {
      notify.error(error);
    }
  };
  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <form noValidate onSubmit={handleSubmit(submit)}>
        <DialogTitle>{branch ? `Edit ${branch.name}` : "Add branch"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormTextField control={control} name="name" label="Branch name" required />
              <FormTextField control={control} name="code" label="Code" required />
            </Stack>
            <FormTextField control={control} name="address" label="Address" required />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormTextField control={control} name="city" label="City" required />
              <FormTextField control={control} name="openedOn" label="Opened on" type="date" required />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormTextField control={control} name="phone" label="Phone" required />
              <FormTextField control={control} name="email" label="Email" />
            </Stack>
            <FormSwitch control={control} name="active" label="Active" description="Inactive branches are hidden from booking." />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" loading={formState.isSubmitting}>Save</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default function BranchesPanel() {
  const { can } = useAuth();
  const { data: branches = [], isPending } = useBranches();
  const [editing, setEditing] = useState<Branch | null | undefined>(undefined);
  const columns: Column<Branch>[] = [
    { id: "name", label: "Branch", render: (b) => `${b.name}${b.isMain ? " · Main" : ""}`, sortValue: (b) => b.name },
    { id: "code", label: "Code", render: (b) => b.code, hideBelow: "sm" },
    { id: "address", label: "Address", render: (b) => `${b.address}, ${b.city}`, hideBelow: "md" },
    { id: "phone", label: "Phone", render: (b) => b.phone, hideBelow: "lg" },
    { id: "opened", label: "Opened", render: (b) => formatDate(b.openedOn), hideBelow: "lg" },
    { id: "status", label: "Status", render: (b) => <StatusChip status={b.active ? "Active" : "Inactive"} /> },
  ];
  return (
    <SettingsCard title="Branches" description="Each branch has its own schedule, patients, billing and expenses; reports can be consolidated." columns={1} action={can("clinic.edit") && <Button size="small" variant="contained" startIcon={<Add />} onClick={() => setEditing(null)}>Add branch</Button>}>
      <DataTable embedded pagination={false} columns={columns} rows={branches} loading={isPending} getRowId={(b) => b.id} renderActions={can("clinic.edit") ? (b) => <Tooltip title="Edit"><IconButton size="small" onClick={() => setEditing(b)} aria-label={`Edit ${b.name}`}><EditOutlined fontSize="small" /></IconButton></Tooltip> : undefined} />
      {editing !== undefined && <BranchDialog branch={editing ?? undefined} onClose={() => setEditing(undefined)} />}
    </SettingsCard>
  );
}

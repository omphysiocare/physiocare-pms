"use client";

import { Add, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Tooltip } from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { DataTable, FilterBar, FilterSelect, StatusChip, useConfirm, type Column } from "@/components/common";
import { FormSwitch, FormTextField } from "@/components/forms";
import { useCatalog, useDeleteCatalogService, useSaveCatalogService, useTerminology } from "@/hooks/useClinic";
import { formatCurrency } from "@/lib/format";
import { matchesSearch } from "@/lib/search";
import { SPECIALTIES, SPECIALTY_OPTIONS } from "@/lib/specialties";
import { optionalText, requiredNumber, requiredText } from "@/lib/validation";
import { useAuth } from "@/providers/AuthProvider";
import { useNotify } from "@/providers/NotificationProvider";
import { SPECIALTY_IDS, type Clinic, type ClinicalService } from "@/types";

import SettingsCard from "./SettingsCard";

const schema = z.object({
  code: optionalText(20),
  name: requiredText("Service name", 120),
  category: requiredText("Category", 60),
  specialty: z.enum(SPECIALTY_IDS),
  durationMinutes: requiredNumber("Duration", { min: 5, max: 480, integer: true }),
  price: requiredNumber("Price", { min: 0 }),
  taxRate: requiredNumber("Tax", { min: 0, max: 28 }),
  description: optionalText(300),
  active: z.boolean(),
});
type Values = z.infer<typeof schema>;

function ServiceDialog({ service, clinic, onClose }: { service?: ClinicalService; clinic: Clinic; onClose: () => void }) {
  const notify = useNotify();
  const save = useSaveCatalogService();
  const { control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: service ?? { code: "", name: "", category: SPECIALTIES[clinic.primarySpecialty].serviceCategories[0], specialty: clinic.primarySpecialty, durationMinutes: 30, price: 0, taxRate: clinic.billingSettings.defaultTaxRate, description: "", active: true },
  });
  const [specialty, category] = useWatch({ control, name: ["specialty", "category"] });
  const submit = async (values: Values) => {
    try {
      await save.mutateAsync({ id: service?.id, input: values });
      notify.success(service ? "Service updated" : "Service added to catalog");
      onClose();
    } catch (error) {
      notify.error(error);
    }
  };
  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <form noValidate onSubmit={handleSubmit(submit)}>
        <DialogTitle>{service ? `Edit ${service.name}` : "Add service"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormTextField control={control} name="name" label="Service name" required />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormTextField control={control} name="specialty" label="Specialty" options={SPECIALTY_OPTIONS} />
              <FormTextField control={control} name="category" label="Category" options={Array.from(new Set([...SPECIALTIES[specialty].serviceCategories, "Consultation", category]))} />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormTextField control={control} name="price" label="Price (₹)" type="number" required />
              <FormTextField control={control} name="taxRate" label="Tax (%)" type="number" />
              <FormTextField control={control} name="durationMinutes" label="Duration (min)" type="number" required />
            </Stack>
            <FormTextField control={control} name="code" label="Code" />
            <FormTextField control={control} name="description" label="Description" multiline minRows={2} />
            <FormSwitch control={control} name="active" label="Active" description="Inactive services can't be booked or billed." />
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

export default function CatalogPanel({ clinic }: { clinic: Clinic }) {
  const { can } = useAuth();
  const notify = useNotify();
  const terms = useTerminology();
  const { data: catalog = [], isPending } = useCatalog();
  const remove = useDeleteCatalogService();
  const { confirm, dialog } = useConfirm();
  const [editing, setEditing] = useState<ClinicalService | null | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const categories = Array.from(new Set(catalog.map((s) => s.category)));
  const rows = useMemo(() => catalog.filter((s) => matchesSearch(search, s.name, s.code, s.description) && (category === "all" || s.category === category)), [catalog, search, category]);

  const columns: Column<ClinicalService>[] = [
    { id: "name", label: terms.service, render: (s) => <Box><Box sx={{ fontWeight: 600 }}>{s.name}</Box><Box sx={{ fontSize: 12, color: "text.secondary" }}>{s.code} · {SPECIALTIES[s.specialty].name}</Box></Box>, sortValue: (s) => s.name },
    { id: "category", label: "Category", render: (s) => s.category, sortValue: (s) => s.category, hideBelow: "sm" },
    { id: "duration", label: "Duration", render: (s) => `${s.durationMinutes} min`, sortValue: (s) => s.durationMinutes, hideBelow: "md" },
    { id: "price", label: "Price", align: "right", render: (s) => formatCurrency(s.price), sortValue: (s) => s.price },
    { id: "tax", label: "Tax", align: "right", render: (s) => `${s.taxRate}%`, sortValue: (s) => s.taxRate, hideBelow: "md" },
    { id: "status", label: "Status", render: (s) => <StatusChip status={s.active ? "Active" : "Inactive"} /> },
  ];

  return (
    <SettingsCard title={`${terms.service} Catalog`} description="Everything you perform and bill. Used in appointments, records and invoices." columns={1} action={can("clinic.edit") && <Button size="small" variant="contained" startIcon={<Add />} onClick={() => setEditing(null)}>Add service</Button>}>
      <Box sx={{ mx: -2.5, mt: -2.5 }}>
        <DataTable
          embedded
          columns={columns}
          rows={rows}
          loading={isPending}
          getRowId={(s) => s.id}
          resetKey={`${search}|${category}`}
          toolbar={<FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search services"><FilterSelect label="Category" value={category} onChange={setCategory} options={[{ value: "all", label: "All categories" }, ...categories.map((c) => ({ value: c, label: c }))]} /></FilterBar>}
          renderActions={
            can("clinic.edit")
              ? (s) => (
                  <Box sx={{ display: "flex" }}>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => setEditing(s)} aria-label={`Edit ${s.name}`}><EditOutlined fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" aria-label={`Delete ${s.name}`} onClick={async () => {
                        if (!(await confirm({ title: `Delete ${s.name}?`, description: "Services used in records can't be deleted — mark them inactive instead.", confirmLabel: "Delete", destructive: true }))) return;
                        remove.mutate(s.id, { onSuccess: () => notify.success("Service deleted"), onError: notify.error });
                      }}><DeleteOutlined fontSize="small" /></IconButton>
                    </Tooltip>
                  </Box>
                )
              : undefined
          }
        />
      </Box>
      {editing !== undefined && <ServiceDialog service={editing ?? undefined} clinic={clinic} onClose={() => setEditing(undefined)} />}
      {dialog}
    </SettingsCard>
  );
}

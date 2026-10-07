"use client";

import { Add, DeleteOutlined, PaymentsOutlined, PersonOutlined, PlaylistAddOutlined, ReceiptLongOutlined } from "@mui/icons-material";
import { Alert, Autocomplete, Box, Button, Card, Divider, IconButton, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

import { SummaryList } from "@/components/common";
import { AppointmentSelectField, FieldSpan, FormActions, FormSection, FormSwitch, FormTextField, PatientSelectField, PatientSummaryCard } from "@/components/forms";
import { useBranches, useCatalog, useTerminology } from "@/hooks/useClinic";
import { useProviders } from "@/hooks/useMembers";
import { calculateInvoiceTotals, lineAmount } from "@/lib/billing";
import { formatCurrency } from "@/lib/format";
import { PAYMENT_METHODS, type ClinicalService } from "@/types";

import { invoiceSchema, newItem, type InvoiceFormValues } from "./schema";
import UnbilledServicesPicker from "./UnbilledServicesPicker";

interface InvoiceFormProps {
  defaultValues: InvoiceFormValues;
  submitLabel: string;
  onSubmit: (values: InvoiceFormValues) => Promise<unknown>;
  onCancel: () => void;
  invoiceId?: string;
  alreadyPaid?: number;
}

export default function InvoiceForm({ defaultValues, submitLabel, onSubmit, onCancel, invoiceId, alreadyPaid = 0 }: InvoiceFormProps) {
  const terms = useTerminology();
  const { data: catalog = [] } = useCatalog();
  const { data: providers = [] } = useProviders();
  const { data: branches = [] } = useBranches();
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { isSubmitting, isDirty, errors },
  } = useForm<InvoiceFormValues>({ resolver: zodResolver(invoiceSchema), defaultValues, mode: "onTouched" });
  const { fields, append, remove } = useFieldArray({ control, name: "items", keyName: "fieldKey" });
  const [patientId, items, discount, recordPayment] = useWatch({ control, name: ["patientId", "items", "discount", "recordPayment"] });
  const totals = calculateInvoiceTotals({ items: items ?? [], discount: discount ?? 0 });
  const recordIds = (items ?? []).map((item) => item.serviceRecordId).filter(Boolean);
  const addService = (service: ClinicalService | null) => service && append(newItem({ description: service.name, serviceId: service.id, unitPrice: service.price, taxRate: service.taxRate }));

  return (
    <Stack component="form" spacing={3} noValidate onSubmit={handleSubmit(onSubmit)}>
      <FormSection title="Patient & Invoice" icon={<PersonOutlined />} columns={3}>
        <Box sx={{ gridColumn: { md: "1 / -1", lg: "1 / 3" } }}>
          <PatientSelectField
            control={control}
            name="patientId"
            disabled={Boolean(invoiceId)}
            onPatientChange={(patient) => {
              setValue("appointmentId", "");
              setValue("items", [], { shouldDirty: true });
              if (!patient) return;
              if (!getValues("providerId")) setValue("providerId", patient.primaryProviderId, { shouldValidate: true });
              if (!getValues("branchId")) setValue("branchId", patient.branchId, { shouldValidate: true });
            }}
          />
        </Box>
        <Box sx={{ gridRow: { lg: "span 2" } }}>
          <PatientSummaryCard patientId={patientId} />
        </Box>
        <FormTextField control={control} name="invoiceDate" label="Invoice date" type="date" required onValueChange={(value) => setValue("dueDate", dayjs(String(value)).add(7, "day").format("YYYY-MM-DD"))} />
        <FormTextField control={control} name="dueDate" label="Due date" type="date" required />
        <FormTextField control={control} name="providerId" label={terms.provider} required options={providers.map((p) => ({ value: p.id, label: p.name }))} />
        <FormTextField control={control} name="branchId" label="Branch" required options={branches.map((b) => ({ value: b.id, label: b.name }))} />
        <AppointmentSelectField control={control} name="appointmentId" patientId={patientId} />
      </FormSection>

      <FormSection
        title="Line Items"
        description={`${terms.services}, consultations and other charges`}
        icon={<ReceiptLongOutlined />}
        columns={1}
        action={<Button size="small" startIcon={<Add />} onClick={() => append(newItem())}>Custom item</Button>}
      >
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          <Autocomplete<ClinicalService>
            options={catalog.filter((s) => s.active)}
            groupBy={(option) => option.category}
            getOptionLabel={(option) => `${option.name} · ${formatCurrency(option.price)}${option.taxRate ? ` + ${option.taxRate}% tax` : ""}`}
            value={null}
            onChange={(_, value) => addService(value)}
            renderInput={(params) => <TextField {...params} label={`Add from ${terms.service.toLowerCase()} catalog`} placeholder="Search services" />}
            blurOnSelect
          />
          {patientId && (
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: "grey.50", border: 1, borderColor: "divider" }}>
              <Typography variant="subtitle2" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <PlaylistAddOutlined fontSize="small" color="primary" /> Bill completed {terms.serviceRecords.toLowerCase()}
              </Typography>
              <UnbilledServicesPicker
                patientId={patientId}
                selectedIds={recordIds}
                invoiceId={invoiceId}
                onAdd={(records) =>
                  append(
                    records.map((record) => {
                      const service = catalog.find((s) => s.id === record.serviceId);
                      return newItem({ description: `${record.serviceName} — Session ${record.sessionNumber} (${dayjs(record.date).format("DD MMM")})`, serviceId: record.serviceId, serviceRecordId: record.id, unitPrice: record.amount, taxRate: service?.taxRate ?? 0 });
                    }),
                  )
                }
              />
            </Box>
          )}
        </Box>

        {(errors.items?.root?.message || errors.items?.message) && <Alert severity="error">{errors.items?.root?.message ?? errors.items?.message}</Alert>}

        {fields.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 3 }}>
            No line items yet. Add from the catalog, bill completed records, or add a custom item.
          </Typography>
        ) : (
          <Stack spacing={1.5} divider={<Divider flexItem />}>
            {fields.map((field, index) => (
              <Box key={field.fieldKey} sx={{ display: "grid", gap: 1.5, alignItems: "start", gridTemplateColumns: { xs: "1fr 1fr 1fr auto", md: "minmax(0, 1fr) 80px 120px 90px 110px auto" } }}>
                <Box sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}>
                  <FormTextField control={control} name={`items.${index}.description`} label="Description" required helperText={items?.[index]?.serviceRecordId ? `Linked to ${items[index].serviceRecordId}` : undefined} />
                </Box>
                <FormTextField control={control} name={`items.${index}.quantity`} label="Qty" type="number" required />
                <FormTextField control={control} name={`items.${index}.unitPrice`} label="Rate (₹)" type="number" required />
                <FormTextField control={control} name={`items.${index}.taxRate`} label="Tax %" type="number" />
                <Typography sx={{ display: { xs: "none", md: "block" }, pt: 1, textAlign: "right", fontWeight: 600 }}>{formatCurrency(lineAmount(items?.[index] ?? { quantity: 0, unitPrice: 0 }))}</Typography>
                <Tooltip title="Remove item">
                  <IconButton onClick={() => remove(index)} aria-label={`Remove item ${index + 1}`} sx={{ mt: 0.25 }}>
                    <DeleteOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Stack>
        )}

        <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "1fr 320px" }, alignItems: "start" }}>
          <Box sx={{ display: "grid", gap: 2 }}>
            <FormTextField control={control} name="discount" label="Discount (₹)" type="number" helperText="Applied before tax" />
            <FormTextField control={control} name="notes" label="Invoice notes" multiline minRows={2} />
          </Box>
          <Card variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
            <SummaryList
              rows={[
                { label: "Subtotal", value: formatCurrency(totals.subtotal) },
                { label: "Discount", value: `− ${formatCurrency(totals.discount)}`, hidden: totals.discount === 0 },
                { label: "Tax", value: formatCurrency(totals.tax), hidden: totals.tax === 0 },
                { label: "Total", value: formatCurrency(totals.total), emphasis: true },
                { label: "Already paid", value: formatCurrency(alreadyPaid), hidden: alreadyPaid === 0 },
              ]}
            />
          </Card>
        </Box>
      </FormSection>

      {!invoiceId && (
        <FormSection title="Payment" description="Record a payment received at the time of billing" icon={<PaymentsOutlined />} columns={3}>
          <FieldSpan>
            <FormSwitch control={control} name="recordPayment" label="Payment received now" description="Leave off to bill the patient later." />
          </FieldSpan>
          {recordPayment && (
            <>
              <FormTextField control={control} name="payment.amount" label="Amount received (₹)" type="number" required helperText={`Invoice total ${formatCurrency(totals.total)}`} />
              <FormTextField control={control} name="payment.method" label="Payment method" required options={PAYMENT_METHODS} />
              <FormTextField control={control} name="payment.reference" label="Reference / transaction ID" />
            </>
          )}
        </FormSection>
      )}

      <FormActions submitting={isSubmitting} submitLabel={submitLabel} onCancel={onCancel} onReset={() => reset(defaultValues)} isDirty={isDirty} />
    </Stack>
  );
}

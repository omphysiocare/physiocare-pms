import { Box, Typography } from "@mui/material";

import { IdLink, PatientCell, StatusChip, type Column } from "@/components/common";
import { today } from "@/lib/dates";
import { formatCurrency, formatDate } from "@/lib/format";
import type { InvoiceWithRelations, PaymentRecord } from "@/types";

export function isOverdue(invoice: InvoiceWithRelations): boolean {
  return invoice.balance > 0 && invoice.status !== "Cancelled" && invoice.status !== "Refunded" && invoice.dueDate < today();
}

export function describeItems(invoice: InvoiceWithRelations): string {
  const first = invoice.items[0]?.description.replace(/\s\(.*\)$/, "") ?? "—";
  return invoice.items.length > 1 ? `${first} + ${invoice.items.length - 1} more` : first;
}

export function getInvoiceColumns({ hidePatient = false } = {}): Column<InvoiceWithRelations>[] {
  const columns: (Column<InvoiceWithRelations> | false)[] = [
    { id: "id", label: "Invoice", render: (row) => <IdLink id={row.id} href={`/billing/${row.id}`} />, sortValue: (row) => row.id },
    !hidePatient && { id: "patient", label: "Patient", render: (row) => <PatientCell patient={row.patient} />, sortValue: (row) => row.patient.name },
    {
      id: "date",
      label: "Date",
      render: (row) => (
        <Box sx={{ whiteSpace: "nowrap" }}>
          <Typography variant="body2">{formatDate(row.invoiceDate)}</Typography>
          <Typography variant="caption" color={isOverdue(row) ? "error.main" : "text.secondary"}>
            Due {formatDate(row.dueDate, "DD MMM")}
            {isOverdue(row) ? " · Overdue" : ""}
          </Typography>
        </Box>
      ),
      sortValue: (row) => row.invoiceDate,
      hideBelow: "sm",
    },
    { id: "items", label: "Service", render: (row) => <Typography variant="body2" sx={{ maxWidth: 220 }} noWrap title={row.items.map((i) => i.description).join("\n")}>{describeItems(row)}</Typography>, hideBelow: "xl" },
    { id: "provider", label: "Provider", render: (row) => row.provider.name, sortValue: (row) => row.provider.name, hideBelow: "xl" },
    { id: "total", label: "Total", align: "right", render: (row) => formatCurrency(row.total), sortValue: (row) => row.total },
    { id: "paid", label: "Paid", align: "right", render: (row) => formatCurrency(row.paid), sortValue: (row) => row.paid, hideBelow: "lg" },
    {
      id: "balance",
      label: "Pending",
      align: "right",
      render: (row) => <Box component="span" sx={{ fontWeight: 600, color: row.balance > 0 && row.status !== "Cancelled" ? "warning.dark" : "text.primary" }}>{formatCurrency(row.status === "Cancelled" ? 0 : row.balance)}</Box>,
      sortValue: (row) => row.balance,
      hideBelow: "md",
    },
    { id: "status", label: "Status", render: (row) => <StatusChip status={row.status} />, sortValue: (row) => row.status },
  ];
  return columns.filter((column): column is Column<InvoiceWithRelations> => Boolean(column));
}

export function getPaymentColumns({ hidePatient = false } = {}): Column<PaymentRecord>[] {
  const columns: (Column<PaymentRecord> | false)[] = [
    { id: "receipt", label: "Receipt", render: (row) => <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: "ui-monospace, monospace", fontSize: 13 }}>{row.receiptNumber}</Typography>, sortValue: (row) => row.receiptNumber },
    { id: "date", label: "Date", render: (row) => formatDate(row.date), sortValue: (row) => row.date },
    !hidePatient && { id: "patient", label: "Patient", render: (row) => <PatientCell patient={row.patient} />, sortValue: (row) => row.patient.name },
    { id: "invoice", label: "Invoice", render: (row) => <IdLink id={row.invoiceId} href={`/billing/${row.invoiceId}`} />, sortValue: (row) => row.invoiceId, hideBelow: "sm" },
    { id: "method", label: "Method", render: (row) => row.method, sortValue: (row) => row.method, hideBelow: "md" },
    { id: "kind", label: "Type", render: (row) => <StatusChip status={row.kind === "refund" ? "Refunded" : "Paid"} label={row.kind === "refund" ? "Refund" : "Payment"} />, sortValue: (row) => row.kind, hideBelow: "md" },
    { id: "amount", label: "Amount", align: "right", render: (row) => <Box component="span" sx={{ fontWeight: 600, color: row.kind === "refund" ? "error.main" : "success.main" }}>{row.kind === "refund" ? "−" : "+"}{formatCurrency(row.amount)}</Box>, sortValue: (row) => (row.kind === "refund" ? -row.amount : row.amount) },
  ];
  return columns.filter((column): column is Column<PaymentRecord> => Boolean(column));
}

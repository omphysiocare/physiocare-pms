"use client";

import { BlockOutlined, CalendarMonthOutlined, CurrencyRupee, DeleteOutlined, EditOutlined, EventOutlined, NotesOutlined, PaymentsOutlined, PersonOutlined, PictureAsPdfOutlined, ReceiptLongOutlined, UndoOutlined } from "@mui/icons-material";
import { Box, Button, Chip, LinearProgress, Link as MuiLink, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import Link from "next/link";
import { useState } from "react";

import { ActivityTimeline, DetailHero, DetailLayout, EmptyState, PageHeader, QueryBoundary, QuickActions, SectionCard, StatusChip, SummaryList } from "@/components/common";
import { MessageHistory, WhatsAppButton } from "@/components/messaging";
import { InvoiceDocument, PrintButton } from "@/components/print";
import { useInvoice } from "@/hooks/useBilling";
import { useBranches, useClinic } from "@/hooks/useClinic";
import { usePdfDownload } from "@/hooks/useDocuments";
import { usePatient } from "@/hooks/usePatients";
import { lineAmount } from "@/lib/billing";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { useAuth } from "@/providers/AuthProvider";
import { pdfService } from "@/services/pdfService";
import type { InvoiceWithRelations } from "@/types";

import { isOverdue } from "./columns";
import { RecordPaymentDialog, RefundDialog } from "./PaymentDialogs";
import ReceiptActions from "./ReceiptActions";
import { useInvoiceActions } from "./useInvoiceActions";

function InvoiceDetail({ invoice }: { invoice: InvoiceWithRelations }) {
  const { can } = useAuth();
  const { data: clinic } = useClinic();
  const { data: branches = [] } = useBranches();
  const { data: patient } = usePatient(invoice.patientId);
  const pdf = usePdfDownload();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const { cancel, remove, dialog, editable } = useInvoiceActions({ redirectAfterDelete: "/billing" });
  const branch = branches.find((b) => b.id === invoice.branchId);
  const overdue = isOverdue(invoice);
  const cancelled = invoice.status === "Cancelled";
  const open = editable(invoice);
  const paidPercent = invoice.total > 0 ? Math.min(100, (Math.max(invoice.paid, 0) / invoice.total) * 100) : 0;
  const document = () => (clinic && patient ? <InvoiceDocument clinic={clinic} branch={branch} invoice={invoice} patient={patient} /> : null);

  return (
    <>
      <PageHeader
        title={`Invoice ${invoice.id}`}
        description={`Created ${formatDateTime(invoice.createdAt)}`}
        backHref="/billing"
        backLabel="Billing"
        actions={
          <>
            <PrintButton title={invoice.id} document={document} disabled={!clinic || !patient} />
            <Button variant="outlined" startIcon={<PictureAsPdfOutlined />} loading={pdf.pending} onClick={() => pdf.download(() => pdfService.invoice(invoice.id))}>PDF</Button>
            {open && can("billing.edit") && <Button variant="outlined" startIcon={<EditOutlined />} component={Link} href={`/billing/${invoice.id}/edit`}>Edit</Button>}
            {open && invoice.balance > 0 && can("billing.create") && <Button variant="contained" startIcon={<PaymentsOutlined />} onClick={() => setPaymentOpen(true)}>Record Payment</Button>}
          </>
        }
      />

      <DetailHero
        icon={<ReceiptLongOutlined />}
        tone={cancelled ? "neutral" : invoice.status === "Paid" ? "success" : "warning"}
        title={formatCurrency(invoice.total)}
        badges={<>{<StatusChip status={invoice.status} />}{overdue && <Chip size="small" color="error" label="Overdue" />}</>}
        subtitle={`${invoice.patient.name} · ${invoice.patientId} · ${invoice.provider.name}`}
        meta={[
          { icon: <EventOutlined />, label: "Invoice date", value: formatDate(invoice.invoiceDate) },
          { icon: <CalendarMonthOutlined />, label: "Due date", value: formatDate(invoice.dueDate) },
          { icon: <CurrencyRupee />, label: "Paid", value: formatCurrency(invoice.paid) },
          { icon: <PaymentsOutlined />, label: "Pending", value: formatCurrency(cancelled ? 0 : invoice.balance) },
        ]}
      />

      <DetailLayout
        main={
          <>
            <SectionCard title="Invoice Items" icon={<ReceiptLongOutlined />} subtitle={`${invoice.items.length} line item(s)`} disablePadding>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell align="right" sx={{ display: { xs: "none", sm: "table-cell" } }}>Qty</TableCell>
                      <TableCell align="right" sx={{ display: { xs: "none", sm: "table-cell" } }}>Rate</TableCell>
                      <TableCell align="right" sx={{ display: { xs: "none", md: "table-cell" } }}>Tax</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoice.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.description}</Typography>
                          {item.serviceRecordId && <MuiLink component={Link} href={`/treatments/${item.serviceRecordId}`} variant="caption" underline="hover">{item.serviceRecordId}</MuiLink>}
                        </TableCell>
                        <TableCell align="right" sx={{ display: { xs: "none", sm: "table-cell" } }}>{item.quantity}</TableCell>
                        <TableCell align="right" sx={{ display: { xs: "none", sm: "table-cell" } }}>{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell align="right" sx={{ display: { xs: "none", md: "table-cell" } }}>{item.taxRate}%</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(lineAmount(item))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ display: "flex", justifyContent: "flex-end", p: 2.5 }}>
                <Box sx={{ width: { xs: "100%", sm: 300 } }}>
                  <SummaryList
                    rows={[
                      { label: "Subtotal", value: formatCurrency(invoice.subtotal) },
                      { label: "Discount", value: `− ${formatCurrency(invoice.discount)}`, hidden: invoice.discount === 0 },
                      { label: "Tax", value: formatCurrency(invoice.tax), hidden: invoice.tax === 0 },
                      { label: "Total", value: formatCurrency(invoice.total), emphasis: true },
                      { label: "Paid", value: formatCurrency(invoice.paid) },
                      { label: "Refunded", value: formatCurrency(invoice.refunded), hidden: invoice.refunded === 0 },
                      { label: "Pending", value: formatCurrency(cancelled ? 0 : invoice.balance) },
                    ]}
                  />
                </Box>
              </Box>
            </SectionCard>

            <SectionCard
              title="Payment History"
              icon={<PaymentsOutlined />}
              subtitle={`${invoice.payments.length} transaction(s)`}
              disablePadding
              action={
                <Box sx={{ display: "flex", gap: 1 }}>
                  {invoice.paid > 0 && can("billing.refund") && <Button size="small" color="warning" startIcon={<UndoOutlined />} onClick={() => setRefundOpen(true)}>Refund</Button>}
                  {open && invoice.balance > 0 && can("billing.create") && <Button size="small" startIcon={<PaymentsOutlined />} onClick={() => setPaymentOpen(true)}>Record payment</Button>}
                </Box>
              }
            >
              {invoice.payments.length === 0 ? (
                <EmptyState compact title="No payments recorded" description={cancelled ? "This invoice was cancelled." : "Record a payment when the patient pays."} />
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Receipt</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Method</TableCell>
                        <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>Reference</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right" aria-label="Actions" />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoice.payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{payment.receiptNumber}</Typography>
                            <Typography variant="caption" color="text.secondary">{payment.kind === "refund" ? "Refund" : "Payment"}{payment.note ? ` · ${payment.note}` : ""}</Typography>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(payment.date)}</TableCell>
                          <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{payment.method}</TableCell>
                          <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>{payment.reference || "—"}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: payment.kind === "refund" ? "error.main" : "success.main", whiteSpace: "nowrap" }}>{payment.kind === "refund" ? "−" : ""}{formatCurrency(payment.amount)}</TableCell>
                          <TableCell align="right" sx={{ width: 150 }}>
                            <ReceiptActions invoice={invoice} payment={payment} clinic={clinic} patient={patient} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </SectionCard>

            <SectionCard title="Notes" icon={<NotesOutlined />}>
              <Typography variant="body2" color={invoice.notes ? "text.primary" : "text.secondary"} sx={{ whiteSpace: "pre-line" }}>{invoice.notes || "No notes on this invoice."}</Typography>
              {invoice.cancellationReason && <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>Cancellation reason: {invoice.cancellationReason}</Typography>}
            </SectionCard>
            <SectionCard title="Communication" disablePadding>
              <MessageHistory filters={{ patientId: invoice.patientId, relatedType: "invoice", relatedId: invoice.id }} />
            </SectionCard>
            <SectionCard title="Activity" disablePadding>
              <ActivityTimeline recordId={invoice.id} />
            </SectionCard>
          </>
        }
        aside={
          <>
            <SectionCard title="Payment Summary">
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <StatusChip status={invoice.status} />
              </Box>
              <SummaryList rows={[{ label: "Total", value: formatCurrency(invoice.total) }, { label: "Paid", value: formatCurrency(invoice.paid) }, { label: "Pending", value: formatCurrency(cancelled ? 0 : invoice.balance), emphasis: true }, { label: "Last method", value: invoice.paymentMethod ?? "—" }]} />
              {!cancelled && (
                <>
                  <LinearProgress variant="determinate" value={paidPercent} color={paidPercent >= 100 ? "success" : "warning"} sx={{ height: 8, borderRadius: 4, mt: 2 }} aria-label="Paid percentage" />
                  <Typography variant="caption" color="text.secondary">{Math.round(paidPercent)}% paid</Typography>
                </>
              )}
            </SectionCard>
            <SectionCard title="Send to Patient">
              <Stack spacing={1.5}>
                <WhatsAppButton
                  fullWidth
                  label="Send Invoice on WhatsApp"
                  patientId={invoice.patientId}
                  relatedType="invoice"
                  relatedId={invoice.id}
                  defaultType="invoice"
                  types={invoice.balance > 0 && !cancelled ? ["payment_reminder"] : []}
                  lastMessage={invoice.lastMessage}
                />
                <Typography variant="caption" color="text.secondary">Generates the branded invoice PDF and sends it with a message. Receipts can be sent from each payment row.</Typography>
              </Stack>
            </SectionCard>
            <SectionCard title="Billed To">
              <MuiLink component={Link} href={`/patients/${invoice.patientId}`} underline="hover" sx={{ fontWeight: 600 }}>{invoice.patient.name}</MuiLink>
              <Typography variant="caption" color="text.secondary" component="p">{invoice.patientId} · {invoice.patient.phone}</Typography>
              <SummaryList rows={[{ label: "Branch", value: branch?.name ?? "—" }, { label: "Appointment", value: invoice.appointmentId ? <MuiLink component={Link} href={`/appointments/${invoice.appointmentId}`}>{invoice.appointmentId}</MuiLink> : "—" }]} />
            </SectionCard>
            <QuickActions
              actions={[
                { label: "View patient", icon: <PersonOutlined />, href: `/patients/${invoice.patientId}` },
                { label: "Cancel invoice", icon: <BlockOutlined />, onClick: () => cancel(invoice), destructive: true, hidden: !open || invoice.paid > 0 || !can("billing.edit") },
                { label: "Delete invoice", icon: <DeleteOutlined />, onClick: () => remove(invoice), destructive: true, hidden: invoice.payments.length > 0 || !can("billing.delete") },
              ]}
            />
          </>
        }
      />
      <RecordPaymentDialog invoice={invoice} open={paymentOpen} onClose={() => setPaymentOpen(false)} />
      <RefundDialog invoice={invoice} open={refundOpen} onClose={() => setRefundOpen(false)} />
      {dialog}
    </>
  );
}

export default function InvoiceDetailView({ id }: { id: string }) {
  const query = useInvoice(id);
  return <QueryBoundary query={query} resource="Invoice" backHref="/billing">{(invoice) => <InvoiceDetail invoice={invoice} />}</QueryBoundary>;
}

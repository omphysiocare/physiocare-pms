"use client";

import { DeleteOutlined, PictureAsPdfOutlined, PrintOutlined } from "@mui/icons-material";
import { Box, CircularProgress, IconButton, Tooltip } from "@mui/material";

import { useConfirm } from "@/components/common";
import { WhatsAppIcon } from "@/components/messaging";
import { ReceiptDocument } from "@/components/print";
import { useRemovePayment } from "@/hooks/useBilling";
import { usePdfDownload } from "@/hooks/useDocuments";
import { useSendWhatsApp } from "@/hooks/useMessaging";
import { formatCurrency } from "@/lib/format";
import { useAuth } from "@/providers/AuthProvider";
import { useNotify } from "@/providers/NotificationProvider";
import { usePrint } from "@/providers/PrintProvider";
import { pdfService } from "@/services/pdfService";
import type { Clinic, InvoiceWithRelations, Payment, PatientListItem } from "@/types";

/** Per-payment actions: print / PDF / one-click WhatsApp receipt, remove. */
export default function ReceiptActions({ invoice, payment, clinic, patient }: { invoice: InvoiceWithRelations; payment: Payment; clinic?: Clinic; patient?: PatientListItem }) {
  const { can } = useAuth();
  const notify = useNotify();
  const { printDocument } = usePrint();
  const pdf = usePdfDownload();
  const send = useSendWhatsApp();
  const removePayment = useRemovePayment(invoice.id);
  const { confirm, dialog } = useConfirm();
  const label = payment.kind === "refund" ? "refund note" : "receipt";

  const sendReceipt = async () => {
    try {
      await send.mutateAsync({ type: "payment_receipt", relatedType: "payment", relatedId: payment.id, patientId: invoice.patientId, invoiceId: invoice.id });
      notify.success(`Receipt ${payment.receiptNumber} sent on WhatsApp`);
    } catch (error) {
      notify.error(error);
    }
  };

  const remove = async () => {
    const ok = await confirm({ title: `Remove ${payment.kind}?`, description: `${payment.receiptNumber} of ${formatCurrency(payment.amount)} will be removed from ${invoice.id}.`, confirmLabel: "Remove", destructive: true });
    if (!ok) return;
    try {
      await removePayment.mutateAsync(payment.id);
      notify.success(`${payment.receiptNumber} removed`);
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.25 }}>
      <Tooltip title={`Print ${label}`}>
        <span>
          <IconButton size="small" disabled={!clinic || !patient} onClick={() => clinic && patient && printDocument(<ReceiptDocument clinic={clinic} invoice={invoice} patient={patient} payment={payment} />, payment.receiptNumber)} aria-label={`Print ${payment.receiptNumber}`}>
            <PrintOutlined fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={`Download ${label} PDF`}>
        <span>
          <IconButton size="small" disabled={pdf.pending} onClick={() => pdf.download(() => pdfService.receipt(invoice.id, payment.id))} aria-label={`PDF ${payment.receiptNumber}`}>
            {pdf.pending ? <CircularProgress size={16} /> : <PictureAsPdfOutlined fontSize="small" />}
          </IconButton>
        </span>
      </Tooltip>
      {payment.kind === "payment" && can("messaging.send") && (
        <Tooltip title="Send receipt on WhatsApp">
          <span>
            <IconButton size="small" disabled={send.isPending} onClick={sendReceipt} sx={{ color: "#128C7E" }} aria-label={`WhatsApp ${payment.receiptNumber}`}>
              {send.isPending ? <CircularProgress size={16} /> : <WhatsAppIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
      )}
      {can("billing.delete") && (
        <Tooltip title={`Remove ${payment.kind}`}>
          <IconButton size="small" onClick={remove} aria-label={`Remove ${payment.receiptNumber}`}>
            <DeleteOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {dialog}
    </Box>
  );
}

"use client";

import { BlockOutlined, DeleteOutlined, EditOutlined, PaymentsOutlined, VisibilityOutlined } from "@mui/icons-material";
import { useRouter } from "next/navigation";

import { useConfirm, type RowAction } from "@/components/common";
import { useCancelInvoice, useDeleteInvoice } from "@/hooks/useBilling";
import { useAuth } from "@/providers/AuthProvider";
import { useNotify } from "@/providers/NotificationProvider";
import type { InvoiceWithRelations } from "@/types";

export function useInvoiceActions({ redirectAfterDelete, onRecordPayment }: { redirectAfterDelete?: string; onRecordPayment?: (invoice: InvoiceWithRelations) => void } = {}) {
  const router = useRouter();
  const notify = useNotify();
  const { can } = useAuth();
  const { confirm, dialog } = useConfirm();
  const cancelInvoice = useCancelInvoice();
  const deleteInvoice = useDeleteInvoice();

  const cancel = async (invoice: InvoiceWithRelations) => {
    const ok = await confirm({ title: "Cancel invoice?", description: `${invoice.id} for ${invoice.patient.name} will be voided. Its services become available for billing again.`, confirmLabel: "Cancel invoice", cancelLabel: "Keep", destructive: true });
    if (!ok) return;
    try {
      await cancelInvoice.mutateAsync({ id: invoice.id, reason: "Cancelled by clinic" });
      notify.success(`Invoice ${invoice.id} cancelled`);
    } catch (error) {
      notify.error(error);
    }
  };

  const remove = async (invoice: InvoiceWithRelations) => {
    const ok = await confirm({ title: "Delete invoice?", description: `${invoice.id} will be permanently deleted. Invoices with payment history cannot be deleted.`, confirmLabel: "Delete", destructive: true });
    if (!ok) return;
    try {
      await deleteInvoice.mutateAsync(invoice.id);
      notify.success(`Invoice ${invoice.id} deleted`);
      if (redirectAfterDelete) router.push(redirectAfterDelete);
    } catch (error) {
      notify.error(error);
    }
  };

  const editable = (invoice: InvoiceWithRelations) => invoice.status !== "Cancelled" && invoice.status !== "Refunded";

  const rowActions = (invoice: InvoiceWithRelations): RowAction[] => [
    { label: "View invoice", icon: <VisibilityOutlined />, href: `/billing/${invoice.id}` },
    { label: "Edit", icon: <EditOutlined />, href: `/billing/${invoice.id}/edit`, hidden: !editable(invoice) || !can("billing.edit") },
    { label: "Record payment", icon: <PaymentsOutlined />, onClick: () => onRecordPayment?.(invoice), hidden: !onRecordPayment || invoice.balance <= 0 || !editable(invoice) || !can("billing.create"), divider: true },
    { label: "Cancel invoice", icon: <BlockOutlined />, onClick: () => cancel(invoice), hidden: !editable(invoice) || invoice.paid > 0 || !can("billing.edit"), destructive: true, divider: true },
    { label: "Delete", icon: <DeleteOutlined />, onClick: () => remove(invoice), destructive: true, hidden: invoice.payments.length > 0 || !can("billing.delete") },
  ];

  return { cancel, remove, rowActions, dialog, editable };
}

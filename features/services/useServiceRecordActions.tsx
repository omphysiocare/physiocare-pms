"use client";

import { CancelOutlined, CheckCircleOutlined, DeleteOutlined, EditOutlined, PlayCircleOutlined, ReceiptLongOutlined, ReplayOutlined, VisibilityOutlined } from "@mui/icons-material";
import { useRouter } from "next/navigation";

import { useConfirm, type RowAction, type StatusTransition } from "@/components/common";
import { useTerminology } from "@/hooks/useClinic";
import { useDeleteServiceRecord, useUpdateServiceRecordStatus } from "@/hooks/useServiceRecords";
import { today } from "@/lib/dates";
import { useAuth } from "@/providers/AuthProvider";
import { useNotify } from "@/providers/NotificationProvider";
import type { ServiceRecordStatus, ServiceRecordWithRelations } from "@/types";

export function serviceRecordTransitions(status: ServiceRecordStatus): StatusTransition<ServiceRecordStatus>[] {
  switch (status) {
    case "Scheduled":
      return [
        { status: "In Progress", label: "Start", icon: <PlayCircleOutlined />, variant: "contained" },
        { status: "Completed", label: "Mark completed", icon: <CheckCircleOutlined />, color: "success" },
        { status: "Cancelled", label: "Cancel", icon: <CancelOutlined />, color: "error" },
      ];
    case "In Progress":
      return [
        { status: "Completed", label: "Mark completed", icon: <CheckCircleOutlined />, color: "success", variant: "contained" },
        { status: "Cancelled", label: "Cancel", icon: <CancelOutlined />, color: "error" },
      ];
    case "Cancelled":
      return [{ status: "Scheduled", label: "Reschedule", icon: <ReplayOutlined /> }];
    case "Completed":
      return [];
  }
}

export function useServiceRecordActions({ redirectAfterDelete }: { redirectAfterDelete?: string } = {}) {
  const router = useRouter();
  const notify = useNotify();
  const terms = useTerminology();
  const { can } = useAuth();
  const { confirm, dialog } = useConfirm();
  const updateStatus = useUpdateServiceRecordStatus();
  const remove_ = useDeleteServiceRecord();

  const changeStatus = async (record: ServiceRecordWithRelations, status: ServiceRecordStatus) => {
    if ((status === "Completed" || status === "In Progress") && record.date > today()) return notify.error("A future record cannot be started or completed. Edit the date first.");
    if (status === "Cancelled") {
      if (record.invoiceId) return notify.error(`This record is billed on ${record.invoiceId}. Cancel the invoice first.`);
      const ok = await confirm({ title: `Cancel ${terms.serviceRecord.toLowerCase()}?`, description: `${record.id} for ${record.patient.name} will be marked as cancelled.`, confirmLabel: "Cancel it", cancelLabel: "Keep", destructive: true });
      if (!ok) return;
    }
    try {
      await updateStatus.mutateAsync({ id: record.id, status });
      notify.success(`${record.id} marked as ${status.toLowerCase()}`);
    } catch (error) {
      notify.error(error);
    }
  };

  const remove = async (record: ServiceRecordWithRelations) => {
    const ok = await confirm({ title: `Delete ${terms.serviceRecord.toLowerCase()}?`, description: `${record.id} for ${record.patient.name} will be permanently deleted.`, confirmLabel: "Delete", destructive: true });
    if (!ok) return;
    try {
      await remove_.mutateAsync(record.id);
      notify.success(`${record.id} deleted`);
      if (redirectAfterDelete) router.push(redirectAfterDelete);
    } catch (error) {
      notify.error(error);
    }
  };

  const transitions = (record: ServiceRecordWithRelations) => (can("services.edit") ? serviceRecordTransitions(record.status) : []);

  const rowActions = (record: ServiceRecordWithRelations): RowAction[] => [
    { label: "View details", icon: <VisibilityOutlined />, href: `/treatments/${record.id}` },
    { label: "Edit", icon: <EditOutlined />, href: `/treatments/${record.id}/edit`, hidden: !can("services.edit") },
    ...transitions(record).map((t, index) => ({ label: t.label, icon: t.icon, onClick: () => changeStatus(record, t.status), destructive: t.status === "Cancelled", divider: index === 0 })),
    {
      label: record.invoiceId ? `View invoice ${record.invoiceId}` : "Create invoice",
      icon: <ReceiptLongOutlined />,
      href: record.invoiceId ? `/billing/${record.invoiceId}` : `/billing/new?patientId=${record.patientId}&serviceRecordId=${record.id}`,
      hidden: record.status !== "Completed" || (!record.invoiceId && !can("billing.create")),
      divider: true,
    },
    { label: "Delete", icon: <DeleteOutlined />, onClick: () => remove(record), destructive: true, divider: true, hidden: !can("services.delete") },
  ];

  return { changeStatus, transitions, remove, rowActions, dialog, pending: updateStatus.isPending };
}

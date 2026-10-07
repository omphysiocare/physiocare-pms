"use client";

import { CalendarMonthOutlined, DeleteOutlined, EditOutlined, SelfImprovementOutlined, VisibilityOutlined } from "@mui/icons-material";
import { useRouter } from "next/navigation";

import { useConfirm, type RowAction } from "@/components/common";
import { useTerminology } from "@/hooks/useClinic";
import { useDeleteConsultation } from "@/hooks/useConsultations";
import { useAuth } from "@/providers/AuthProvider";
import { useNotify } from "@/providers/NotificationProvider";
import type { ConsultationWithRelations } from "@/types";

export function useConsultationActions({ redirectAfterDelete }: { redirectAfterDelete?: string } = {}) {
  const router = useRouter();
  const notify = useNotify();
  const terms = useTerminology();
  const { can } = useAuth();
  const { confirm, dialog } = useConfirm();
  const remove_ = useDeleteConsultation();

  const remove = async (consultation: ConsultationWithRelations) => {
    const ok = await confirm({ title: `Delete ${terms.consultation.toLowerCase()}?`, description: `Clinical record ${consultation.id} for ${consultation.patient.name} will be permanently deleted.`, confirmLabel: "Delete", destructive: true });
    if (!ok) return;
    try {
      await remove_.mutateAsync(consultation.id);
      notify.success(`${terms.consultation} ${consultation.id} deleted`);
      if (redirectAfterDelete) router.push(redirectAfterDelete);
    } catch (error) {
      notify.error(error);
    }
  };

  const rowActions = (consultation: ConsultationWithRelations): RowAction[] => [
    { label: "View record", icon: <VisibilityOutlined />, href: `/consultations/${consultation.id}` },
    { label: "Edit", icon: <EditOutlined />, href: `/consultations/${consultation.id}/edit`, hidden: !can("consultations.edit") },
    { label: `Record ${terms.serviceRecord.toLowerCase()}`, icon: <SelfImprovementOutlined />, href: `/treatments/new?patientId=${consultation.patientId}&consultationId=${consultation.id}`, divider: true, hidden: !can("services.create") },
    { label: "Book follow-up", icon: <CalendarMonthOutlined />, href: `/appointments/new?patientId=${consultation.patientId}`, hidden: !can("appointments.create") },
    { label: "Delete", icon: <DeleteOutlined />, onClick: () => remove(consultation), destructive: true, divider: true, hidden: !can("consultations.delete") },
  ];

  return { remove, rowActions, dialog };
}

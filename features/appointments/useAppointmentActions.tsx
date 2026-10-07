"use client";

import {
  CancelOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EventAvailableOutlined,
  EventBusyOutlined,
  HowToRegOutlined,
  MedicalServicesOutlined,
  ReplayOutlined,
  UpdateOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { useConfirm, type RowAction } from "@/components/common";
import { useDeleteAppointment, useUpdateAppointmentStatus } from "@/hooks/useAppointments";
import { today } from "@/lib/dates";
import { isConsultationType } from "@/lib/specialties";
import { useAuth } from "@/providers/AuthProvider";
import { useNotify } from "@/providers/NotificationProvider";
import { APPOINTMENT_TRANSITIONS } from "@/services/appointmentService";
import type { AppointmentStatus, AppointmentWithRelations } from "@/types";

import { CancelDialog, RescheduleDialog } from "./AppointmentDialogs";

export interface AppointmentAction {
  key: string;
  label: string;
  icon: ReactNode;
  color?: "primary" | "success" | "error" | "warning" | "inherit" | "secondary";
  run: () => void;
}

const STATUS_ACTION: Partial<Record<AppointmentStatus, { label: string; icon: ReactNode; color: AppointmentAction["color"] }>> = {
  Confirmed: { label: "Confirm", icon: <EventAvailableOutlined />, color: "primary" },
  "Checked In": { label: "Check in", icon: <HowToRegOutlined />, color: "secondary" },
  "In Consultation": { label: "Start consultation", icon: <MedicalServicesOutlined />, color: "warning" },
  Completed: { label: "Complete", icon: <CheckCircleOutlined />, color: "success" },
  "No Show": { label: "Mark no show", icon: <EventBusyOutlined />, color: "error" },
  Scheduled: { label: "Reopen", icon: <ReplayOutlined />, color: "inherit" },
};

/** Workflow actions for an appointment: confirm → check in → consult → complete, plus cancel/reschedule/no-show. */
export function useAppointmentActions({ redirectAfterDelete }: { redirectAfterDelete?: string } = {}) {
  const router = useRouter();
  const notify = useNotify();
  const { can } = useAuth();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const updateStatus = useUpdateAppointmentStatus();
  const deleteAppointment = useDeleteAppointment();
  const [cancelling, setCancelling] = useState<AppointmentWithRelations | null>(null);
  const [rescheduling, setRescheduling] = useState<AppointmentWithRelations | null>(null);

  const changeStatus = async (appointment: AppointmentWithRelations, status: AppointmentStatus) => {
    if ((status === "Completed" || status === "Checked In" || status === "In Consultation") && appointment.date > today()) {
      notify.error("This appointment is in the future. Reschedule it to today first.");
      return;
    }
    if (status === "No Show") {
      const ok = await confirm({ title: "Mark as no show?", description: `${appointment.patient.name} did not attend ${appointment.id}.`, confirmLabel: "Mark no show", destructive: true });
      if (!ok) return;
    }
    try {
      await updateStatus.mutateAsync({ id: appointment.id, status });
      notify.success(`Appointment ${appointment.id}: ${status}`);
      if (status === "In Consultation" && isConsultationType(appointment.type) && can("consultations.create")) {
        router.push(`/consultations/new?patientId=${appointment.patientId}&appointmentId=${appointment.id}`);
      }
    } catch (error) {
      notify.error(error);
    }
  };

  /** Lifecycle actions available from the current status, respecting permissions. */
  const workflowActions = (appointment: AppointmentWithRelations): AppointmentAction[] => {
    if (!can("appointments.edit")) return [];
    // Visit-day steps only make sense on (or after) the appointment date.
    const future = appointment.date > today();
    const visitDay: AppointmentStatus[] = ["Checked In", "In Consultation", "Completed", "No Show"];
    const next = APPOINTMENT_TRANSITIONS[appointment.status].filter((status) => !(future && visitDay.includes(status)));
    const actions: AppointmentAction[] = next
      .filter((status) => status !== "Cancelled" && status !== "Rescheduled" && STATUS_ACTION[status])
      .map((status) => ({ key: status, ...STATUS_ACTION[status]!, run: () => changeStatus(appointment, status) }));
    if (next.includes("Rescheduled")) actions.push({ key: "reschedule", label: "Reschedule", icon: <UpdateOutlined />, color: "inherit", run: () => setRescheduling(appointment) });
    if (next.includes("Cancelled") && can("appointments.cancel")) actions.push({ key: "cancel", label: "Cancel", icon: <CancelOutlined />, color: "error", run: () => setCancelling(appointment) });
    return actions;
  };

  const remove = async (appointment: AppointmentWithRelations) => {
    const ok = await confirm({ title: "Delete appointment?", description: `${appointment.id} for ${appointment.patient.name} will be permanently deleted. Cancel it instead to keep history.`, confirmLabel: "Delete", destructive: true });
    if (!ok) return;
    try {
      await deleteAppointment.mutateAsync(appointment.id);
      notify.success(`Appointment ${appointment.id} deleted`);
      if (redirectAfterDelete) router.push(redirectAfterDelete);
    } catch (error) {
      notify.error(error);
    }
  };

  const rowActions = (appointment: AppointmentWithRelations): RowAction[] => [
    { label: "View details", icon: <VisibilityOutlined />, href: `/appointments/${appointment.id}` },
    { label: "Edit", icon: <EditOutlined />, href: `/appointments/${appointment.id}/edit`, hidden: !can("appointments.edit") },
    ...workflowActions(appointment).map((action, index) => ({ label: action.label, icon: action.icon, onClick: action.run, destructive: action.color === "error", divider: index === 0 })),
    { label: "Delete", icon: <DeleteOutlined />, onClick: () => remove(appointment), destructive: true, divider: true, hidden: !can("appointments.cancel") },
  ];

  const dialogs = (
    <>
      {confirmDialog}
      {cancelling && <CancelDialog appointment={cancelling} onClose={() => setCancelling(null)} />}
      {rescheduling && <RescheduleDialog appointment={rescheduling} onClose={() => setRescheduling(null)} />}
    </>
  );

  return { workflowActions, rowActions, remove, dialogs, pending: updateStatus.isPending };
}

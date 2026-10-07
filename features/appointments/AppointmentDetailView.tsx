"use client";

import {
  AccessTimeOutlined,
  CalendarMonthOutlined,
  DeleteOutlined,
  EditOutlined,
  MedicalInformationOutlined,
  PersonOutlined,
  PlaceOutlined,
  ReceiptLongOutlined,
  SelfImprovementOutlined,
} from "@mui/icons-material";
import { Box, Button, Link as MuiLink, Stack, Typography } from "@mui/material";
import Link from "next/link";

import {
  ActivityTimeline,
  DetailHero,
  DetailLayout,
  DetailList,
  PageHeader,
  QueryBoundary,
  QuickActions,
  RelatedRecordList,
  SectionCard,
  StatusChip,
} from "@/components/common";
import { MessageHistory, WhatsAppButton } from "@/components/messaging";
import { useAppointment } from "@/hooks/useAppointments";
import { useInvoices } from "@/hooks/useBilling";
import { useTerminology } from "@/hooks/useClinic";
import { useConsultations } from "@/hooks/useConsultations";
import { usePatient } from "@/hooks/usePatients";
import { useServiceRecords } from "@/hooks/useServiceRecords";
import { formatCurrency, formatDate, formatDateTime, formatTime } from "@/lib/format";
import { isConsultationType } from "@/lib/specialties";
import { useAuth } from "@/providers/AuthProvider";
import type { AppointmentWithRelations, MessageType } from "@/types";

import { useAppointmentActions } from "./useAppointmentActions";

function defaultMessage(appointment: AppointmentWithRelations): MessageType {
  if (appointment.status === "Cancelled") return "appointment_cancellation";
  if (appointment.status === "Rescheduled") return "appointment_reschedule";
  if (appointment.status === "Completed") return "review_request";
  if (appointment.status === "Confirmed" || appointment.status === "Checked In") return "appointment_reminder";
  return "appointment_confirmation";
}

function AppointmentDetail({ appointment }: { appointment: AppointmentWithRelations }) {
  const { can } = useAuth();
  const terms = useTerminology();
  const { workflowActions, remove, dialogs, pending } = useAppointmentActions({ redirectAfterDelete: "/appointments" });
  const { data: patient } = usePatient(appointment.patientId);
  const { data: consultations = [] } = useConsultations(appointment.patientId);
  const { data: records = [] } = useServiceRecords(appointment.patientId);
  const { data: invoices = [] } = useInvoices(appointment.patientId);

  const linkedConsultations = consultations.filter((item) => item.appointmentId === appointment.id);
  const linkedRecords = records.filter((item) => item.appointmentId === appointment.id);
  const linkedInvoices = invoices.filter((item) => item.appointmentId === appointment.id);
  const active = ["Scheduled", "Confirmed", "Rescheduled", "Checked In", "In Consultation"].includes(appointment.status);
  const actions = workflowActions(appointment);

  return (
    <>
      <PageHeader
        title="Appointment Details"
        description={`${appointment.id} · Booked ${formatDateTime(appointment.createdAt)}`}
        backHref="/appointments"
        backLabel="Appointments"
        actions={
          <>
            {can("appointments.edit") && (
              <Button variant="outlined" startIcon={<EditOutlined />} component={Link} href={`/appointments/${appointment.id}/edit`}>
                Edit
              </Button>
            )}
            <Button variant="contained" startIcon={<PersonOutlined />} component={Link} href={`/patients/${appointment.patientId}`}>
              View Patient
            </Button>
          </>
        }
      />

      <DetailHero
        icon={<CalendarMonthOutlined />}
        title={appointment.type}
        badges={<StatusChip status={appointment.status} />}
        subtitle={`${formatDate(appointment.date, "dddd, DD MMMM YYYY")} · ${formatTime(appointment.startTime)} – ${formatTime(appointment.endTime)}`}
        meta={[
          { icon: <PersonOutlined />, label: "Patient", value: appointment.patient.name },
          { icon: <MedicalInformationOutlined />, label: terms.provider, value: appointment.provider.name },
          { icon: <PlaceOutlined />, label: "Location", value: `${appointment.branch.name}${appointment.location ? ` · ${appointment.location}` : ""}` },
          { icon: <AccessTimeOutlined />, label: "Checked in", value: appointment.checkedInAt ? formatDateTime(appointment.checkedInAt) : "—" },
        ]}
      />

      <DetailLayout
        main={
          <>
            <SectionCard title="Appointment Information" icon={<CalendarMonthOutlined />}>
              <DetailList
                items={[
                  { label: "Appointment ID", value: appointment.id },
                  { label: "Type", value: appointment.type },
                  { label: terms.service, value: appointment.service?.name ?? "Not specified" },
                  { label: "Date", value: formatDate(appointment.date, "ddd, DD MMM YYYY") },
                  { label: "Time", value: `${formatTime(appointment.startTime)} – ${formatTime(appointment.endTime)}` },
                  { label: terms.provider, value: appointment.provider.name },
                  { label: "Branch", value: appointment.branch.name },
                  { label: "Room", value: appointment.location },
                  { label: "Status", value: <StatusChip status={appointment.status} /> },
                  { label: "Rescheduled from", value: appointment.rescheduledFrom ? `${formatDate(appointment.rescheduledFrom.date)} ${formatTime(appointment.rescheduledFrom.startTime)}` : "", hidden: !appointment.rescheduledFrom },
                  { label: "Cancellation reason", value: appointment.cancellationReason, hidden: appointment.status !== "Cancelled" },
                  { label: "Reason for visit", value: appointment.reason, fullWidth: true },
                  { label: "Notes", value: appointment.notes, fullWidth: true },
                ]}
              />
            </SectionCard>

            <SectionCard title="Patient" icon={<PersonOutlined />} action={<Button size="small" component={Link} href={`/patients/${appointment.patientId}`}>Open profile</Button>}>
              <DetailList
                items={[
                  { label: "Name", value: <MuiLink component={Link} href={`/patients/${appointment.patientId}`} underline="hover">{appointment.patient.name}</MuiLink> },
                  { label: "Patient ID", value: appointment.patientId },
                  { label: "Mobile", value: appointment.patient.phone },
                  { label: "Gender / Age", value: patient ? `${patient.gender}, ${patient.age} yrs` : "—" },
                  { label: "Allergies", value: patient?.medical.allergies },
                  { label: "Condition", value: patient?.medical.primaryCondition, fullWidth: true },
                ]}
              />
            </SectionCard>

            <SectionCard title="Linked Records" subtitle={`${terms.consultation}, ${terms.serviceRecord.toLowerCase()} and billing for this visit`} disablePadding>
              <RelatedRecordList
                emptyText="Nothing is linked to this appointment yet."
                records={[
                  ...linkedConsultations.map((item) => ({ id: item.id, href: `/consultations/${item.id}`, icon: <MedicalInformationOutlined />, title: `${terms.consultation} ${item.id}`, subtitle: item.diagnosis })),
                  ...linkedRecords.map((item) => ({ id: item.id, href: `/treatments/${item.id}`, icon: <SelfImprovementOutlined />, title: `${item.serviceName} · ${item.id}`, subtitle: `Session ${item.sessionNumber} of ${item.totalSessions} · ${formatCurrency(item.amount)}`, status: item.status })),
                  ...linkedInvoices.map((item) => ({ id: item.id, href: `/billing/${item.id}`, icon: <ReceiptLongOutlined />, title: `Invoice ${item.id}`, subtitle: `${formatCurrency(item.total)} · Balance ${formatCurrency(item.balance)}`, status: item.status })),
                ]}
              />
            </SectionCard>

            <SectionCard title="Communication" subtitle="WhatsApp messages for this appointment" disablePadding>
              <MessageHistory filters={{ relatedType: "appointment", relatedId: appointment.id }} />
            </SectionCard>

            <SectionCard title="Activity" subtitle="Audit trail" disablePadding>
              <ActivityTimeline recordId={appointment.id} />
            </SectionCard>
          </>
        }
        aside={
          <>
            <SectionCard title="Workflow">
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Current status
                </Typography>
                <StatusChip status={appointment.status} />
              </Box>
              {actions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No further workflow steps for this appointment.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {actions.map((action, index) => (
                    <Button key={action.key} fullWidth variant={index === 0 ? "contained" : "outlined"} color={action.color === "inherit" ? "inherit" : (action.color ?? "primary")} startIcon={action.icon} disabled={pending} onClick={action.run}>
                      {action.label}
                    </Button>
                  ))}
                </Stack>
              )}
            </SectionCard>

            <SectionCard title="Notify Patient">
              <WhatsAppButton
                fullWidth
                patientId={appointment.patientId}
                relatedType="appointment"
                relatedId={appointment.id}
                defaultType={defaultMessage(appointment)}
                types={["appointment_confirmation", "appointment_reminder", "appointment_reschedule", "appointment_cancellation", "follow_up_reminder", "review_request"]}
                lastMessage={appointment.lastMessage}
              />
            </SectionCard>

            <QuickActions
              actions={[
                { label: `Add ${terms.consultation.toLowerCase()} notes`, icon: <MedicalInformationOutlined />, href: `/consultations/new?patientId=${appointment.patientId}&appointmentId=${appointment.id}`, hidden: !can("consultations.create") || !isConsultationType(appointment.type) || linkedConsultations.length > 0 || appointment.status === "Cancelled" },
                { label: `Record ${terms.serviceRecord.toLowerCase()}`, icon: <SelfImprovementOutlined />, href: `/treatments/new?patientId=${appointment.patientId}&appointmentId=${appointment.id}`, hidden: !can("services.create") || linkedRecords.length > 0 || appointment.status === "Cancelled" },
                { label: "Create invoice", icon: <ReceiptLongOutlined />, href: `/billing/new?patientId=${appointment.patientId}&appointmentId=${appointment.id}`, hidden: !can("billing.create") || linkedInvoices.length > 0 || appointment.status !== "Completed" },
                { label: "Book follow-up", icon: <CalendarMonthOutlined />, href: `/appointments/new?patientId=${appointment.patientId}`, hidden: active || !can("appointments.create") },
                { label: "Delete appointment", icon: <DeleteOutlined />, onClick: () => remove(appointment), destructive: true, hidden: !can("appointments.cancel") },
              ]}
            />
          </>
        }
      />
      {dialogs}
    </>
  );
}

export default function AppointmentDetailView({ id }: { id: string }) {
  const query = useAppointment(id);
  return (
    <QueryBoundary query={query} resource="Appointment" backHref="/appointments">
      {(appointment) => <AppointmentDetail appointment={appointment} />}
    </QueryBoundary>
  );
}

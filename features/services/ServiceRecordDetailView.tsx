"use client";

import { CalendarMonthOutlined, CurrencyRupee, DeleteOutlined, EditOutlined, MedicalInformationOutlined, PersonOutlined, ReceiptLongOutlined, SelfImprovementOutlined, TuneOutlined } from "@mui/icons-material";
import { Box, Button, LinearProgress, Link as MuiLink, Typography } from "@mui/material";
import Link from "next/link";

import { ActivityTimeline, ClinicalFieldsView, DetailHero, DetailLayout, DetailList, PageHeader, QueryBoundary, QuickActions, RelatedRecordList, SectionCard, StatusChip, StatusPanel } from "@/components/common";
import { WhatsAppButton } from "@/components/messaging";
import { useClinic, useTerminology } from "@/hooks/useClinic";
import { useMembers } from "@/hooks/useMembers";
import { usePatient } from "@/hooks/usePatients";
import { useServiceRecord } from "@/hooks/useServiceRecords";
import { addMinutesToTime, formatCurrency, formatDate, formatDateTime, formatTime } from "@/lib/format";
import { getSpecialty } from "@/lib/specialties";
import { useAuth } from "@/providers/AuthProvider";
import type { ServiceRecordWithRelations } from "@/types";

import { useServiceRecordActions } from "./useServiceRecordActions";

function ServiceRecordDetail({ record }: { record: ServiceRecordWithRelations }) {
  const { can } = useAuth();
  const terms = useTerminology();
  const { data: clinic } = useClinic();
  const { data: members = [] } = useMembers();
  const { data: patient } = usePatient(record.patientId);
  const { changeStatus, transitions, remove, dialog, pending } = useServiceRecordActions({ redirectAfterDelete: "/treatments" });
  const specialty = members.find((m) => m.id === record.providerId)?.specialty || clinic?.primarySpecialty;
  const fields = getSpecialty(specialty).serviceRecordFields;
  const progress = Math.min(100, (record.sessionNumber / record.totalSessions) * 100);

  return (
    <>
      <PageHeader
        title={`${terms.serviceRecord} Details`}
        description={`${record.id} · Recorded ${formatDateTime(record.createdAt)}`}
        backHref="/treatments"
        backLabel={terms.services}
        actions={
          <>
            {can("services.edit") && <Button variant="outlined" startIcon={<EditOutlined />} component={Link} href={`/treatments/${record.id}/edit`}>Edit</Button>}
            <Button variant="contained" startIcon={<PersonOutlined />} component={Link} href={`/patients/${record.patientId}`}>View Patient</Button>
          </>
        }
      />
      <DetailHero
        icon={<SelfImprovementOutlined />}
        tone="secondary"
        title={record.serviceName}
        badges={<StatusChip status={record.status} />}
        subtitle={`Session ${record.sessionNumber} of ${record.totalSessions}${record.area ? ` · ${record.area}` : ""}`}
        meta={[
          { icon: <PersonOutlined />, label: "Patient", value: record.patient.name },
          { icon: <CalendarMonthOutlined />, label: "Date & time", value: `${formatDate(record.date)} · ${formatTime(record.startTime)}` },
          { icon: <MedicalInformationOutlined />, label: terms.provider, value: record.provider.name },
          { icon: <CurrencyRupee />, label: "Fee", value: formatCurrency(record.amount) },
        ]}
      />
      <DetailLayout
        main={
          <>
            <SectionCard title={`${terms.serviceRecord} Information`} icon={<SelfImprovementOutlined />}>
              <DetailList
                items={[
                  { label: "Record ID", value: record.id },
                  { label: terms.service, value: record.serviceName },
                  { label: "Category", value: record.service.category },
                  { label: terms.area, value: record.area },
                  { label: "Session", value: `${record.sessionNumber} of ${record.totalSessions}` },
                  { label: "Date", value: formatDate(record.date, "ddd, DD MMM YYYY") },
                  { label: "Time", value: `${formatTime(record.startTime)} – ${formatTime(addMinutesToTime(record.startTime, record.durationMinutes))} (${record.durationMinutes} min)` },
                  { label: terms.provider, value: record.provider.name },
                  { label: "Amount", value: formatCurrency(record.amount) },
                  { label: "Notes", value: record.notes, fullWidth: true },
                ]}
              />
            </SectionCard>
            {fields.length > 0 && Object.keys(record.customFields).length > 0 && (
              <SectionCard title="Outcome" icon={<TuneOutlined />}>
                <ClinicalFieldsView fields={fields} values={record.customFields} />
              </SectionCard>
            )}
            <SectionCard title="Patient" icon={<PersonOutlined />} action={<Button size="small" component={Link} href={`/patients/${record.patientId}`}>Open profile</Button>}>
              <DetailList
                items={[
                  { label: "Name", value: <MuiLink component={Link} href={`/patients/${record.patientId}`} underline="hover">{record.patient.name}</MuiLink> },
                  { label: "Patient ID", value: record.patientId },
                  { label: "Mobile", value: record.patient.phone },
                  { label: "Gender / Age", value: patient ? `${patient.gender}, ${patient.age} yrs` : "—" },
                ]}
              />
            </SectionCard>
            <SectionCard title="Linked Records" disablePadding>
              <RelatedRecordList
                emptyText="Not linked to an appointment, consultation or invoice."
                records={[
                  ...(record.appointmentId ? [{ id: record.appointmentId, href: `/appointments/${record.appointmentId}`, icon: <CalendarMonthOutlined />, title: `Appointment ${record.appointmentId}`, subtitle: formatDate(record.date) }] : []),
                  ...(record.consultationId ? [{ id: record.consultationId, href: `/consultations/${record.consultationId}`, icon: <MedicalInformationOutlined />, title: `Plan of care ${record.consultationId}`, subtitle: terms.consultation }] : []),
                  ...(record.invoiceId ? [{ id: record.invoiceId, href: `/billing/${record.invoiceId}`, icon: <ReceiptLongOutlined />, title: `Invoice ${record.invoiceId}`, subtitle: "Billed" }] : []),
                ]}
              />
            </SectionCard>
            <SectionCard title="Activity" disablePadding>
              <ActivityTimeline recordId={record.id} />
            </SectionCard>
          </>
        }
        aside={
          <>
            <StatusPanel
              status={record.status}
              transitions={transitions(record)}
              onChange={(status) => changeStatus(record, status)}
              pending={pending}
              rows={[
                { label: "Fee", value: formatCurrency(record.amount) },
                {
                  label: "Billing",
                  value: record.invoiceId ? <MuiLink component={Link} href={`/billing/${record.invoiceId}`}>{record.invoiceId}</MuiLink> : record.status === "Completed" ? <Typography component="span" variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>Not invoiced</Typography> : "—",
                },
              ]}
            />
            <SectionCard title="Plan Progress">
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Session</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{record.sessionNumber} / {record.totalSessions}</Typography>
              </Box>
              <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
            </SectionCard>
            {record.status === "Completed" && (
              <SectionCard title="Notify Patient">
                <WhatsAppButton fullWidth patientId={record.patientId} relatedType="serviceRecord" relatedId={record.id} defaultType="treatment_update" types={["review_request", "follow_up_reminder"]} label="Send update" />
              </SectionCard>
            )}
            <QuickActions
              actions={[
                { label: "Create invoice", icon: <ReceiptLongOutlined />, href: `/billing/new?patientId=${record.patientId}&serviceRecordId=${record.id}`, hidden: record.status !== "Completed" || record.invoiceId !== null || !can("billing.create") },
                { label: "Record next session", icon: <SelfImprovementOutlined />, href: `/treatments/new?patientId=${record.patientId}${record.consultationId ? `&consultationId=${record.consultationId}` : ""}`, hidden: !can("services.create") },
                { label: "Book appointment", icon: <CalendarMonthOutlined />, href: `/appointments/new?patientId=${record.patientId}`, hidden: !can("appointments.create") },
                { label: "Delete", icon: <DeleteOutlined />, onClick: () => remove(record), destructive: true, hidden: !can("services.delete") },
              ]}
            />
          </>
        }
      />
      {dialog}
    </>
  );
}

export default function ServiceRecordDetailView({ id }: { id: string }) {
  const query = useServiceRecord(id);
  return <QueryBoundary query={query} resource="Record" backHref="/treatments">{(record) => <ServiceRecordDetail record={record} />}</QueryBoundary>;
}

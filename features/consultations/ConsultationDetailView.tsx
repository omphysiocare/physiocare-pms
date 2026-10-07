"use client";

import {
  AssignmentOutlined,
  CalendarMonthOutlined,
  DeleteOutlined,
  EditOutlined,
  EventRepeatOutlined,
  FactCheckOutlined,
  HealingOutlined,
  MedicationOutlined,
  MonitorHeartOutlined,
  PersonOutlined,
  PictureAsPdfOutlined,
  ScienceOutlined,
  SelfImprovementOutlined,
  TuneOutlined,
} from "@mui/icons-material";
import { Box, Button, LinearProgress, Link as MuiLink, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import Link from "next/link";

import {
  ActivityTimeline,
  ClinicalFieldsView,
  DetailHero,
  DetailLayout,
  DetailList,
  PageHeader,
  QueryBoundary,
  QuickActions,
  RelatedRecordList,
  SectionCard,
  SummaryList,
} from "@/components/common";
import { MessageHistory, WhatsAppButton } from "@/components/messaging";
import { PrescriptionDocument, PrintButton } from "@/components/print";
import { useClinic, useTerminology } from "@/hooks/useClinic";
import { useConsultation } from "@/hooks/useConsultations";
import { usePdfDownload } from "@/hooks/useDocuments";
import { useMembers } from "@/hooks/useMembers";
import { usePatient } from "@/hooks/usePatients";
import { useServiceRecords } from "@/hooks/useServiceRecords";
import { vitalsSummary } from "@/lib/clinical";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { getTemplate } from "@/lib/specialties";
import { useAuth } from "@/providers/AuthProvider";
import { pdfService } from "@/services/pdfService";
import type { ConsultationWithRelations } from "@/types";

import { useConsultationActions } from "./useConsultationActions";

function ConsultationDetail({ consultation }: { consultation: ConsultationWithRelations }) {
  const { can } = useAuth();
  const terms = useTerminology();
  const { data: clinic } = useClinic();
  const { data: patient } = usePatient(consultation.patientId);
  const { data: members = [] } = useMembers();
  const { data: records = [] } = useServiceRecords(consultation.patientId);
  const { remove, dialog } = useConsultationActions({ redirectAfterDelete: "/consultations" });
  const pdf = usePdfDownload();
  const provider = members.find((m) => m.id === consultation.providerId);
  const template = getTemplate(consultation.templateId);
  const planRecords = records.filter((item) => item.consultationId === consultation.id);
  const completed = planRecords.filter((item) => item.status === "Completed").length;
  const progress = consultation.plannedSessions > 0 ? Math.min(100, (completed / consultation.plannedSessions) * 100) : 0;

  return (
    <>
      <PageHeader
        title={`${terms.consultation} Record`}
        description={`${consultation.id} · Recorded ${formatDateTime(consultation.createdAt)}`}
        backHref="/consultations"
        backLabel={terms.consultations}
        actions={
          <>
            <PrintButton
              title={`${consultation.id} ${terms.prescription}`}
              document={() => (clinic && patient ? <PrescriptionDocument clinic={clinic} consultation={consultation} patient={patient} provider={provider} terms={terms} /> : null)}
              disabled={!clinic || !patient}
            />
            <Button variant="outlined" startIcon={<PictureAsPdfOutlined />} loading={pdf.pending} onClick={() => pdf.download(() => pdfService.prescription(consultation.id))}>
              PDF
            </Button>
            {can("consultations.edit") && (
              <Button variant="contained" startIcon={<EditOutlined />} component={Link} href={`/consultations/${consultation.id}/edit`}>
                Edit
              </Button>
            )}
          </>
        }
      />

      <DetailHero
        icon={<AssignmentOutlined />}
        tone="secondary"
        title={consultation.diagnosis}
        subtitle={consultation.chiefComplaint}
        meta={[
          { icon: <PersonOutlined />, label: "Patient", value: consultation.patient.name },
          { icon: <CalendarMonthOutlined />, label: "Date", value: `${formatDate(consultation.date, "ddd, DD MMM YYYY")} · ${consultation.visitType}` },
          { icon: <AssignmentOutlined />, label: terms.provider, value: consultation.provider.name },
          { icon: <EventRepeatOutlined />, label: "Follow-up", value: formatDate(consultation.followUpDate) },
        ]}
      />

      <DetailLayout
        main={
          <>
            <SectionCard title="Vitals" icon={<MonitorHeartOutlined />}>
              <DetailList columns={3} items={vitalsSummary(consultation.vitals).map(([label, value]) => ({ label, value }))} />
            </SectionCard>
            <SectionCard title="Complaint & History" icon={<AssignmentOutlined />}>
              <DetailList
                items={[
                  { label: "Chief complaint", value: consultation.chiefComplaint, fullWidth: true },
                  { label: "History of present illness", value: consultation.history, fullWidth: true },
                  { label: "Medical history", value: consultation.medicalHistory },
                  { label: "Surgical history", value: consultation.surgicalHistory },
                  { label: "Family history", value: consultation.familyHistory },
                  { label: "Allergies", value: consultation.allergies },
                  { label: "Current medications", value: consultation.currentMedications, fullWidth: true },
                ]}
              />
            </SectionCard>
            <SectionCard title="Examination & Findings" icon={<ScienceOutlined />}>
              <DetailList columns={1} items={[{ label: "Examination", value: consultation.examination }, { label: "Clinical findings", value: consultation.findings }]} />
            </SectionCard>
            {template && Object.keys(consultation.customFields).length > 0 && (
              <SectionCard title={template.name} icon={<TuneOutlined />}>
                <ClinicalFieldsView fields={template.sections.flatMap((s) => s.fields)} values={consultation.customFields} />
              </SectionCard>
            )}
            <SectionCard title="Assessment, Diagnosis & Plan" icon={<FactCheckOutlined />}>
              <DetailList
                items={[
                  { label: "Assessment", value: consultation.assessment, fullWidth: true },
                  { label: "Diagnosis", value: consultation.diagnosis, fullWidth: true },
                  { label: "Treatment plan", value: consultation.treatmentPlan, fullWidth: true },
                  { label: `Planned ${terms.serviceRecords.toLowerCase()}`, value: consultation.plannedSessions || "None" },
                  { label: "Follow-up", value: formatDate(consultation.followUpDate) },
                  { label: "Advice", value: consultation.advice, fullWidth: true },
                  { label: "Doctor notes", value: consultation.notes, fullWidth: true },
                ]}
              />
            </SectionCard>
            <SectionCard title={terms.prescription} icon={<MedicationOutlined />} disablePadding>
              {consultation.prescription.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2.5 }}>
                  No items prescribed.
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Dosage</TableCell>
                        <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>Frequency</TableCell>
                        <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>Duration</TableCell>
                        <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Instructions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {consultation.prescription.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                          <TableCell>{item.dosage}</TableCell>
                          <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>{item.frequency}</TableCell>
                          <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>{item.duration}</TableCell>
                          <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{item.instructions || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </SectionCard>
            <SectionCard title={`${terms.serviceRecords} under this plan`} subtitle={`${planRecords.length} records`} disablePadding>
              <RelatedRecordList
                emptyText={`No ${terms.serviceRecords.toLowerCase()} recorded for this plan yet.`}
                records={planRecords.slice(0, 15).map((item) => ({ id: item.id, href: `/treatments/${item.id}`, icon: <SelfImprovementOutlined />, title: `Session ${item.sessionNumber} · ${item.serviceName}`, subtitle: `${formatDate(item.date)} · ${formatCurrency(item.amount)}`, status: item.status }))}
              />
            </SectionCard>
            <SectionCard title="Communication" disablePadding>
              <MessageHistory filters={{ relatedType: "consultation", relatedId: consultation.id }} />
            </SectionCard>
            <SectionCard title="Activity" disablePadding>
              <ActivityTimeline recordId={consultation.id} />
            </SectionCard>
          </>
        }
        aside={
          <>
            <SectionCard title="Share with Patient">
              <Stack spacing={1.5}>
                <WhatsAppButton
                  fullWidth
                  label={`Send ${terms.prescription}`}
                  patientId={consultation.patientId}
                  relatedType="consultation"
                  relatedId={consultation.id}
                  defaultType="prescription"
                  types={["consultation_summary", "follow_up_reminder", "review_request"]}
                />
                <Typography variant="caption" color="text.secondary">
                  Sends a branded PDF of this {terms.prescription.toLowerCase()} with a WhatsApp message.
                </Typography>
              </Stack>
            </SectionCard>
            <SectionCard title="Patient">
              <Box sx={{ mb: 1 }}>
                <MuiLink component={Link} href={`/patients/${consultation.patientId}`} underline="hover" sx={{ fontWeight: 600 }}>
                  {consultation.patient.name}
                </MuiLink>
                <Typography variant="caption" color="text.secondary" component="p">
                  {consultation.patientId} · {consultation.patient.phone}
                </Typography>
              </Box>
              <SummaryList rows={[{ label: "Appointment", value: consultation.appointmentId ? <MuiLink component={Link} href={`/appointments/${consultation.appointmentId}`}>{consultation.appointmentId}</MuiLink> : "—" }, { label: "Visit type", value: consultation.visitType }]} />
            </SectionCard>
            {consultation.plannedSessions > 0 && (
              <SectionCard title="Plan Progress">
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {completed} / {consultation.plannedSessions}
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} color={progress >= 100 ? "success" : "primary"} />
              </SectionCard>
            )}
            <QuickActions
              actions={[
                { label: `Record ${terms.serviceRecord.toLowerCase()}`, icon: <HealingOutlined />, href: `/treatments/new?patientId=${consultation.patientId}&consultationId=${consultation.id}`, hidden: !can("services.create") },
                { label: "Book follow-up", icon: <CalendarMonthOutlined />, href: `/appointments/new?patientId=${consultation.patientId}`, hidden: !can("appointments.create") },
                { label: "View patient profile", icon: <PersonOutlined />, href: `/patients/${consultation.patientId}` },
                { label: `Delete ${terms.consultation.toLowerCase()}`, icon: <DeleteOutlined />, onClick: () => remove(consultation), destructive: true, hidden: !can("consultations.delete") },
              ]}
            />
          </>
        }
      />
      {dialog}
    </>
  );
}

export default function ConsultationDetailView({ id }: { id: string }) {
  const query = useConsultation(id);
  return (
    <QueryBoundary query={query} resource="Consultation" backHref="/consultations">
      {(consultation) => <ConsultationDetail consultation={consultation} />}
    </QueryBoundary>
  );
}

"use client";

import {
  BadgeOutlined,
  CalendarMonthOutlined,
  ContactPhoneOutlined,
  DeleteOutlined,
  EditOutlined,
  EmailOutlined,
  EventAvailableOutlined,
  HealthAndSafetyOutlined,
  HowToRegOutlined,
  MedicalInformationOutlined,
  MedicationOutlined,
  PersonOffOutlined,
  PersonOutlined,
  PhoneOutlined,
  ReceiptLongOutlined,
  SelfImprovementOutlined,
  StorefrontOutlined,
} from "@mui/icons-material";
import { Avatar, Box, Button, Card, Chip, Tab, Tabs, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";

import { DataTable, DetailHero, DetailLayout, DetailList, EmptyState, PageHeader, PersonAvatar, QueryBoundary, QuickActions, RowActions, SectionCard, StatusChip, SummaryList } from "@/components/common";
import { MessageHistory, WhatsAppButton } from "@/components/messaging";
import { getAppointmentColumns } from "@/features/appointments/columns";
import { useAppointmentActions } from "@/features/appointments/useAppointmentActions";
import { getInvoiceColumns, getPaymentColumns } from "@/features/billing/columns";
import { getConsultationColumns } from "@/features/consultations/columns";
import { getServiceRecordColumns } from "@/features/services/columns";
import { useAppointments } from "@/hooks/useAppointments";
import { useInvoices, usePayments } from "@/hooks/useBilling";
import { useTerminology } from "@/hooks/useClinic";
import { useConsultations } from "@/hooks/useConsultations";
import { usePatient } from "@/hooks/usePatients";
import { useServiceRecords } from "@/hooks/useServiceRecords";
import { today } from "@/lib/dates";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import { useAuth } from "@/providers/AuthProvider";
import type { PatientListItem } from "@/types";

import PatientActivity from "./PatientActivity";
import PatientDocuments from "./PatientDocuments";
import PatientNotes from "./PatientNotes";
import { usePatientActions } from "./usePatientActions";

type TabKey = "overview" | "appointments" | "consultations" | "services" | "prescriptions" | "billing" | "payments" | "documents" | "notes" | "messages" | "activity";

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <SectionCard title={title} action={action} disablePadding>
      {children}
    </SectionCard>
  );
}

function PatientDetail({ patient }: { patient: PatientListItem }) {
  const router = useRouter();
  const { can } = useAuth();
  const terms = useTerminology();
  const [tab, setTab] = useState<TabKey>("overview");
  const { remove, setStatus, dialog } = usePatientActions({ redirectAfterDelete: "/patients" });
  const appointmentActions = useAppointmentActions();

  const appointments = useAppointments(patient.id);
  const consultations = useConsultations(patient.id);
  const records = useServiceRecords(patient.id);
  const invoices = useInvoices(patient.id);
  const payments = usePayments(patient.id);

  const summary = useMemo(() => {
    const appts = appointments.data ?? [];
    const active = (invoices.data ?? []).filter((i) => i.status !== "Cancelled");
    return {
      visits: appts.filter((a) => a.status === "Completed").length,
      noShows: appts.filter((a) => a.status === "No Show").length,
      upcoming: appts.filter((a) => ["Scheduled", "Confirmed", "Rescheduled"].includes(a.status) && a.date >= today()).sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)),
      services: (records.data ?? []).filter((r) => r.status === "Completed").length,
      billed: active.reduce((s, i) => s + i.total, 0),
      paid: active.reduce((s, i) => s + i.paid, 0),
      outstanding: active.reduce((s, i) => s + (i.status === "Refunded" ? 0 : i.balance), 0),
      unbilled: (records.data ?? []).filter((r) => r.status === "Completed" && !r.invoiceId).length,
    };
  }, [appointments.data, invoices.data, records.data]);
  const prescriptions = (consultations.data ?? []).filter((c) => c.prescription.length > 0);
  const next = summary.upcoming[0];
  const count = (n?: number) => (n === undefined ? "" : ` (${n})`);

  return (
    <>
      <PageHeader
        title="Patient Profile"
        description={`${patient.id} · Registered ${formatDate(patient.registeredOn)} · ${patient.branchName}`}
        backHref="/patients"
        backLabel="Patients"
        actions={
          <>
            {can("patients.edit") && <Button variant="outlined" startIcon={<EditOutlined />} component={Link} href={`/patients/${patient.id}/edit`}>Edit</Button>}
            {can("appointments.create") && <Button variant="contained" startIcon={<CalendarMonthOutlined />} component={Link} href={`/appointments/new?patientId=${patient.id}`}>Book Appointment</Button>}
          </>
        }
      />

      <DetailHero
        avatar={patient.photo ? <Avatar src={patient.photo} sx={{ width: 64, height: 64 }} /> : <PersonAvatar name={patient.name} size={64} />}
        title={patient.name}
        badges={
          <>
            <StatusChip status={patient.status} />
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "ui-monospace, monospace" }}>{patient.id}</Typography>
            {patient.medical.allergies && patient.medical.allergies !== "None known" && <Chip size="small" color="error" variant="outlined" label={`Allergy: ${patient.medical.allergies}`} />}
          </>
        }
        subtitle={`${patient.gender} · ${patient.age} years · Blood group ${patient.bloodGroup}${patient.medical.primaryCondition ? ` · ${patient.medical.primaryCondition}` : ""}`}
        meta={[
          { icon: <PhoneOutlined />, label: "Mobile", value: patient.phone },
          { icon: <EmailOutlined />, label: "Email", value: patient.email || "—" },
          { icon: <EventAvailableOutlined />, label: "Last visit", value: formatDate(patient.lastVisit) },
          { icon: <MedicalInformationOutlined />, label: `Primary ${terms.provider.toLowerCase()}`, value: patient.primaryProviderName },
        ]}
      />

      <Card sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, value: TabKey) => setTab(value)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile sx={{ px: 1 }}>
          <Tab value="overview" label="Overview" />
          <Tab value="appointments" label={`Appointments${count(appointments.data?.length)}`} />
          <Tab value="consultations" label={`${terms.consultations}${count(consultations.data?.length)}`} />
          <Tab value="services" label={`${terms.services}${count(records.data?.length)}`} />
          <Tab value="prescriptions" label={`${terms.prescription}s${count(prescriptions.length)}`} />
          <Tab value="billing" label={`Billing${count(invoices.data?.length)}`} />
          <Tab value="payments" label={`Payments${count(payments.data?.length)}`} />
          <Tab value="documents" label="Documents" />
          <Tab value="notes" label="Notes" />
          <Tab value="messages" label="Messages" />
          <Tab value="activity" label="Activity" />
        </Tabs>
      </Card>

      <DetailLayout
        main={
          <>
            {tab === "overview" && (
              <>
                <SectionCard title="Personal Information" icon={<PersonOutlined />}>
                  <DetailList
                    columns={3}
                    items={[
                      { label: "Full name", value: patient.name },
                      { label: "Gender", value: patient.gender },
                      { label: "Date of birth", value: `${formatDate(patient.dateOfBirth)} (${patient.age} yrs)` },
                      { label: "Blood group", value: patient.bloodGroup },
                      { label: "Occupation", value: patient.occupation },
                      { label: "Branch", value: patient.branchName },
                    ]}
                  />
                </SectionCard>
                <SectionCard title="Contact & Emergency" icon={<ContactPhoneOutlined />}>
                  <DetailList
                    items={[
                      { label: "Mobile", value: patient.phone },
                      { label: "Alternate mobile", value: patient.alternatePhone },
                      { label: "Email", value: patient.email },
                      { label: "Emergency contact", value: `${patient.emergencyContact.name} (${patient.emergencyContact.relation}) · ${patient.emergencyContact.phone}` },
                      { label: "Address", value: [patient.address.line, patient.address.city, patient.address.state, patient.address.country, patient.address.pincode].filter(Boolean).join(", "), fullWidth: true },
                    ]}
                  />
                </SectionCard>
                <SectionCard title="Medical Information" icon={<HealthAndSafetyOutlined />}>
                  <DetailList
                    items={[
                      { label: "Primary condition", value: patient.medical.primaryCondition, fullWidth: true },
                      { label: "Current status", value: patient.medical.currentCondition, fullWidth: true },
                      { label: "Existing conditions", value: patient.medical.existingConditions },
                      { label: "Allergies", value: patient.medical.allergies },
                      { label: "Current medications", value: patient.medical.currentMedications },
                      { label: "Lifestyle", value: patient.medical.lifestyle },
                      { label: "Medical history", value: patient.medical.medicalHistory, fullWidth: true },
                      { label: "Surgical history", value: patient.medical.surgicalHistory },
                      { label: "Family history", value: patient.medical.familyHistory },
                    ]}
                  />
                </SectionCard>
                <SectionCard title="Referral, Insurance, ID & Consent" icon={<BadgeOutlined />}>
                  <DetailList
                    items={[
                      { label: "Referral source", value: `${patient.referral.source}${patient.referral.detail ? ` — ${patient.referral.detail}` : ""}` },
                      { label: "Insurance", value: patient.insurance.provider ? `${patient.insurance.provider} · ${patient.insurance.policyNumber}${patient.insurance.validTill ? ` (valid till ${formatDate(patient.insurance.validTill)})` : ""}` : "None" },
                      { label: "Identification", value: patient.identification.type ? `${patient.identification.type} · ${patient.identification.number}` : "—" },
                      { label: "Consent", value: `${patient.consent.treatment ? "Treatment ✓" : "Treatment ✗"} · ${patient.consent.communication ? "WhatsApp/SMS ✓" : "WhatsApp/SMS ✗"}${patient.consent.date ? ` · ${formatDate(patient.consent.date)}` : ""}` },
                      { label: "Notes", value: patient.notes, fullWidth: true },
                    ]}
                  />
                </SectionCard>
              </>
            )}

            {tab === "appointments" && (
              <Panel title="Appointments" action={can("appointments.create") && <Button size="small" startIcon={<CalendarMonthOutlined />} component={Link} href={`/appointments/new?patientId=${patient.id}`}>Book</Button>}>
                <DataTable embedded columns={getAppointmentColumns({ hidePatient: true })} rows={appointments.data ?? []} loading={appointments.isPending} getRowId={(r) => r.id} onRowClick={(r) => router.push(`/appointments/${r.id}`)} initialSort={{ columnId: "date", direction: "desc" }} renderActions={(r) => <RowActions actions={appointmentActions.rowActions(r)} />} emptyState={<EmptyState compact title="No appointments yet" />} />
              </Panel>
            )}
            {tab === "consultations" && (
              <Panel title={terms.consultations} action={can("consultations.create") && <Button size="small" startIcon={<MedicalInformationOutlined />} component={Link} href={`/consultations/new?patientId=${patient.id}`}>New</Button>}>
                <DataTable embedded columns={getConsultationColumns({ hidePatient: true })} rows={consultations.data ?? []} loading={consultations.isPending} getRowId={(r) => r.id} onRowClick={(r) => router.push(`/consultations/${r.id}`)} initialSort={{ columnId: "date", direction: "desc" }} emptyState={<EmptyState compact title={`No ${terms.consultations.toLowerCase()}`} />} />
              </Panel>
            )}
            {tab === "services" && (
              <Panel title={terms.services} action={can("services.create") && <Button size="small" startIcon={<SelfImprovementOutlined />} component={Link} href={`/treatments/new?patientId=${patient.id}`}>Record</Button>}>
                <DataTable embedded columns={getServiceRecordColumns(terms, { hidePatient: true })} rows={records.data ?? []} loading={records.isPending} getRowId={(r) => r.id} onRowClick={(r) => router.push(`/treatments/${r.id}`)} initialSort={{ columnId: "date", direction: "desc" }} emptyState={<EmptyState compact title={`No ${terms.serviceRecords.toLowerCase()}`} />} />
              </Panel>
            )}
            {tab === "prescriptions" && (
              <Panel title={`${terms.prescription}s`}>
                {prescriptions.length === 0 ? (
                  <EmptyState compact icon={<MedicationOutlined />} title={`No ${terms.prescription.toLowerCase()}s yet`} />
                ) : (
                  prescriptions.map((c) => (
                    <Box key={c.id} sx={{ px: 2.5, py: 1.75, borderBottom: 1, borderColor: "divider" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(c.date)} · {c.provider.name}</Typography>
                        <Button size="small" component={Link} href={`/consultations/${c.id}`}>Open {c.id}</Button>
                      </Box>
                      <Typography variant="caption" color="text.secondary">{c.diagnosis}</Typography>
                      <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
                        {c.prescription.map((item) => (
                          <Typography component="li" variant="body2" key={item.id}>{item.name}{item.dosage && ` — ${item.dosage}`}{item.frequency && `, ${item.frequency}`}{item.duration && `, ${item.duration}`}</Typography>
                        ))}
                      </Box>
                    </Box>
                  ))
                )}
              </Panel>
            )}
            {tab === "billing" && (
              <Panel title="Invoices" action={can("billing.create") && <Button size="small" startIcon={<ReceiptLongOutlined />} component={Link} href={`/billing/new?patientId=${patient.id}`}>Create invoice</Button>}>
                <DataTable embedded columns={getInvoiceColumns({ hidePatient: true })} rows={invoices.data ?? []} loading={invoices.isPending} getRowId={(r) => r.id} onRowClick={(r) => router.push(`/billing/${r.id}`)} initialSort={{ columnId: "id", direction: "desc" }} emptyState={<EmptyState compact title="No invoices yet" />} />
              </Panel>
            )}
            {tab === "payments" && (
              <Panel title="Payments & refunds">
                <DataTable embedded columns={getPaymentColumns({ hidePatient: true })} rows={payments.data ?? []} loading={payments.isPending} getRowId={(r) => r.id} onRowClick={(r) => router.push(`/billing/${r.invoiceId}`)} initialSort={{ columnId: "date", direction: "desc" }} emptyState={<EmptyState compact title="No payments yet" />} />
              </Panel>
            )}
            {tab === "documents" && <Panel title="Documents"><PatientDocuments patientId={patient.id} /></Panel>}
            {tab === "notes" && <Panel title="Notes"><PatientNotes patientId={patient.id} /></Panel>}
            {tab === "messages" && <Panel title="WhatsApp messages"><MessageHistory filters={{ patientId: patient.id }} /></Panel>}
            {tab === "activity" && (
              <SectionCard title="Activity Timeline" subtitle="Most recent first">
                {appointments.data && consultations.data && records.data && invoices.data ? (
                  <PatientActivity patient={patient} appointments={appointments.data} consultations={consultations.data} treatments={records.data} invoices={invoices.data} />
                ) : (
                  <Typography variant="body2" color="text.secondary">Loading activity…</Typography>
                )}
              </SectionCard>
            )}
          </>
        }
        aside={
          <>
            <SectionCard title="Care Summary">
              <SummaryList
                rows={[
                  { label: "Completed visits", value: summary.visits },
                  { label: terms.serviceRecords, value: summary.services },
                  { label: "No shows", value: summary.noShows },
                  { label: "Upcoming appointments", value: summary.upcoming.length },
                  { label: "Total billed", value: formatCurrency(summary.billed) },
                  { label: "Total paid", value: formatCurrency(summary.paid) },
                  { label: "Outstanding", value: <Box component="span" sx={{ color: summary.outstanding > 0 ? "warning.dark" : "success.main" }}>{formatCurrency(summary.outstanding)}</Box>, emphasis: true },
                ]}
              />
              {next && (
                <Box component={Link} href={`/appointments/${next.id}`} sx={{ display: "block", mt: 2, p: 1.5, borderRadius: 2, bgcolor: "primary.main", color: "primary.contrastText", textDecoration: "none" }}>
                  <Typography variant="caption" sx={{ opacity: 0.85 }}>Next appointment</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(next.date, "ddd, DD MMM")} · {formatTime(next.startTime)} · {next.type}</Typography>
                </Box>
              )}
            </SectionCard>
            <SectionCard title="Message Patient">
              <WhatsAppButton fullWidth patientId={patient.id} relatedType="patient" relatedId={patient.id} defaultType="patient_welcome" types={["review_request"]} />
            </SectionCard>
            <QuickActions
              actions={[
                { label: "Book appointment", icon: <CalendarMonthOutlined />, href: `/appointments/new?patientId=${patient.id}`, hidden: !can("appointments.create") },
                { label: `New ${terms.consultation.toLowerCase()}`, icon: <MedicalInformationOutlined />, href: `/consultations/new?patientId=${patient.id}`, hidden: !can("consultations.create") },
                { label: `Record ${terms.serviceRecord.toLowerCase()}`, icon: <SelfImprovementOutlined />, href: `/treatments/new?patientId=${patient.id}`, hidden: !can("services.create") },
                { label: summary.unbilled > 0 ? `Create invoice (${summary.unbilled} unbilled)` : "Create invoice", icon: <ReceiptLongOutlined />, href: `/billing/new?patientId=${patient.id}`, hidden: !can("billing.create") },
                { label: "Edit patient", icon: <EditOutlined />, href: `/patients/${patient.id}/edit`, hidden: !can("patients.edit") },
                patient.status === "Active"
                  ? { label: "Mark as inactive", icon: <PersonOffOutlined />, onClick: () => setStatus(patient, "Inactive"), hidden: !can("patients.edit") }
                  : { label: "Mark as active", icon: <HowToRegOutlined />, onClick: () => setStatus(patient, "Active"), hidden: !can("patients.edit") },
                { label: "Delete patient", icon: <DeleteOutlined />, onClick: () => remove(patient), destructive: true, hidden: !can("patients.delete") },
              ]}
            />
            <SectionCard title="Branch">
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <StorefrontOutlined fontSize="small" color="action" />
                <Typography variant="body2">{patient.branchName}</Typography>
              </Box>
            </SectionCard>
          </>
        }
      />
      {dialog}
      {appointmentActions.dialogs}
    </>
  );
}

export default function PatientDetailView({ id }: { id: string }) {
  const query = usePatient(id);
  return <QueryBoundary query={query} resource="Patient" backHref="/patients">{(patient) => <PatientDetail patient={patient} />}</QueryBoundary>;
}

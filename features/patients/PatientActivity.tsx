import {
  CalendarMonthOutlined,
  MedicalInformationOutlined,
  PaymentsOutlined,
  PersonAddAltOutlined,
  ReceiptLongOutlined,
  SelfImprovementOutlined,
} from "@mui/icons-material";
import { Box, Link as MuiLink, Typography } from "@mui/material";
import Link from "next/link";
import type { ReactNode } from "react";

import { formatCurrency, formatDate } from "@/lib/format";
import { TONES, type Tone } from "@/theme/tones";
import type {
  AppointmentWithRelations,
  ConsultationWithRelations,
  InvoiceWithRelations,
  PatientListItem,
  ServiceRecordWithRelations,
} from "@/types";

interface ActivityEvent {
  key: string;
  date: string;
  order: string;
  icon: ReactNode;
  tone: Tone;
  title: ReactNode;
  description: string;
}

interface PatientActivityProps {
  patient: PatientListItem;
  appointments: AppointmentWithRelations[];
  consultations: ConsultationWithRelations[];
  treatments: ServiceRecordWithRelations[];
  invoices: InvoiceWithRelations[];
  limit?: number;
}

const link = (href: string, label: string) => (
  <MuiLink component={Link} href={href} underline="hover" sx={{ fontWeight: 600 }}>
    {label}
  </MuiLink>
);

/** Chronological timeline of everything that happened for a patient. */
export default function PatientActivity({ patient, appointments, consultations, treatments, invoices, limit = 40 }: PatientActivityProps) {
  const registered: ActivityEvent = {
    key: "registered",
      date: patient.registeredOn,
      order: "0",
      icon: <PersonAddAltOutlined />,
      tone: "primary",
      title: "Patient registered",
      description: `Referral: ${patient.referral.source}${patient.referral.detail ? ` (${patient.referral.detail})` : ""}`,
  };
  const events: ActivityEvent[] = [
    registered,
    ...appointments
      .filter((item) => item.type !== "Treatment Session")
      .map<ActivityEvent>((item) => ({
        key: item.id,
        date: item.date,
        order: `1${item.startTime}`,
        icon: <CalendarMonthOutlined />,
        tone: item.status === "Cancelled" ? "error" : "info",
        title: <>{link(`/appointments/${item.id}`, item.id)} · {item.type} ({item.status.toLowerCase()})</>,
        description: item.reason,
      })),
    ...consultations.map<ActivityEvent>((item) => ({
      key: item.id,
      date: item.date,
      order: "2",
      icon: <MedicalInformationOutlined />,
      tone: "secondary",
      title: <>Consultation {link(`/consultations/${item.id}`, item.id)}</>,
      description: `${item.diagnosis} · ${item.visitType} visit`,
    })),
    ...treatments.map<ActivityEvent>((item) => ({
      key: item.id,
      date: item.date,
      order: `3${item.startTime}`,
      icon: <SelfImprovementOutlined />,
      tone: item.status === "Completed" ? "success" : item.status === "Cancelled" ? "error" : "neutral",
      title: <>{item.serviceName} · session {item.sessionNumber} ({link(`/treatments/${item.id}`, item.id)})</>,
      description: item.status,
    })),
    ...invoices.map<ActivityEvent>((item) => ({
      key: item.id,
      date: item.invoiceDate,
      order: "4",
      icon: <ReceiptLongOutlined />,
      tone: "warning",
      title: <>Invoice {link(`/billing/${item.id}`, item.id)} created</>,
      description: `${formatCurrency(item.total)} · ${item.status}`,
    })),
    ...invoices.flatMap((invoice) =>
      invoice.payments.map<ActivityEvent>((payment) => ({
        key: payment.id,
        date: payment.date,
        order: "5",
        icon: <PaymentsOutlined />,
        tone: "success",
        title: <>{payment.kind === "refund" ? "Refund issued" : "Payment received"} for {link(`/billing/${invoice.id}`, invoice.id)}</>,
        description: `${formatCurrency(payment.amount)} via ${payment.method} · ${payment.receiptNumber}`,
      })),
    ),
  ]
    .sort((a, b) => `${b.date}${b.order}`.localeCompare(`${a.date}${a.order}`))
    .slice(0, limit);

  return (
    <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0 }}>
      {events.map((event, index) => {
        const tone = TONES[event.tone];
        return (
          <Box component="li" key={event.key} sx={{ display: "flex", gap: 2, position: "relative", pb: index === events.length - 1 ? 0 : 2.5 }}>
            {index < events.length - 1 && (
              <Box sx={{ position: "absolute", left: 17, top: 36, bottom: 0, width: 2, bgcolor: "divider" }} />
            )}
            <Box
              sx={{
                width: 36,
                height: 36,
                flexShrink: 0,
                borderRadius: "50%",
                bgcolor: tone.bg,
                color: tone.fg,
                display: "grid",
                placeItems: "center",
                "& svg": { fontSize: 18 },
              }}
            >
              {event.icon}
            </Box>
            <Box sx={{ minWidth: 0, pt: 0.25 }}>
              <Typography variant="body2">{event.title}</Typography>
              {event.description && (
                <Typography variant="caption" color="text.secondary" component="p">
                  {event.description}
                </Typography>
              )}
              <Typography variant="caption" color="text.disabled">
                {formatDate(event.date, "ddd, DD MMM YYYY")}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

import { vitalsSummary } from "@/lib/clinical";
import { getTemplate } from "@/lib/specialties";
import type { Clinic, ConsultationWithRelations, Member, PatientListItem, Terminology } from "@/types";

import { createDocument, dateLabel, drawFooters, drawLetterhead, ensureSpace, keyValues, paragraph, sectionTitle, signature, table } from "./base";

export interface PrescriptionDocumentData {
  clinic: Clinic;
  consultation: ConsultationWithRelations;
  patient: PatientListItem;
  provider?: Member;
  terms: Terminology;
}

export function buildPrescriptionPdf({ clinic, consultation, patient, provider, terms }: PrescriptionDocumentData) {
  const doc = createDocument();
  let y = drawLetterhead(doc, clinic, {
    title: terms.prescription,
    meta: [
      ["Ref", consultation.id],
      ["Date", dateLabel(consultation.date)],
      ["Visit", consultation.visitType],
    ],
  });

  y = keyValues(
    doc,
    [
      [terms.provider, `${provider?.name ?? consultation.provider.name}${provider?.qualification ? `, ${provider.qualification}` : ""}`],
      ["Registration No", provider?.registrationNumber || "—"],
      ["Patient", `${patient.name} (${patient.id})`],
      ["Age / Gender", `${patient.age} yrs / ${patient.gender}`],
    ],
    y,
  );

  y = sectionTitle(doc, "Vitals", y);
  y = keyValues(doc, vitalsSummary(consultation.vitals).map(([k, v]) => [k, v.replace("°F", "F")]), y, 4);

  y = paragraph(doc, "Chief complaint", consultation.chiefComplaint, y);
  y = paragraph(doc, "Clinical findings", [consultation.examination, consultation.findings].filter(Boolean).join(" "), y);
  const template = getTemplate(consultation.templateId);
  const custom = template?.sections.flatMap((section) => section.fields).filter((field) => consultation.customFields[field.key] != null && consultation.customFields[field.key] !== "") ?? [];
  if (custom.length) {
    y = paragraph(doc, template?.name ?? "Specialty assessment", custom.map((field) => `${field.label}: ${consultation.customFields[field.key]}${field.type === "scale" ? "/10" : ""}`).join("   ·   "), y);
  }
  y = paragraph(doc, "Diagnosis", consultation.diagnosis, y);

  if (consultation.prescription.length) {
    y = ensureSpace(doc, y, 20);
    y = sectionTitle(doc, terms.prescription, y);
    y = table(doc, {
      startY: y,
      accent: clinic.branding.accentColor,
      head: [["#", "Name", "Dosage", "Frequency", "Duration", "Instructions"]],
      body: consultation.prescription.map((item, index) => [String(index + 1), item.name, item.dosage, item.frequency, item.duration, item.instructions || "—"]),
      columnStyles: { 0: { cellWidth: 8 } },
    });
  }
  y = paragraph(doc, "Treatment plan", consultation.treatmentPlan, y);
  y = paragraph(doc, "Advice", consultation.advice, y);
  y = paragraph(doc, "Follow-up", consultation.followUpDate ? dateLabel(consultation.followUpDate) : "", y);
  signature(doc, provider?.designation || terms.provider, provider?.name ?? consultation.provider.name, y);
  drawFooters(doc, clinic, "This prescription is valid only with the provider's signature. In an emergency, contact the clinic or nearest hospital.");
  return doc;
}

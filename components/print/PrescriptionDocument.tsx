import { Box } from "@mui/material";

import { vitalsSummary } from "@/lib/clinical";
import { formatDate } from "@/lib/format";
import { getTemplate } from "@/lib/specialties";
import type { Clinic, ConsultationWithRelations, Member, PatientListItem, Terminology } from "@/types";

import PrintableLayout, { KeyValueGrid, SignatureBlock, printStyles } from "./PrintableLayout";

interface Props {
  clinic: Clinic;
  consultation: ConsultationWithRelations;
  patient: PatientListItem;
  provider?: Member;
  terms: Terminology;
}

function Section({ title, text }: { title: string; text: string }) {
  if (!text) return null;
  return (
    <>
      <h3>{title}</h3>
      <Box sx={{ fontSize: 11, whiteSpace: "pre-line" }}>{text}</Box>
    </>
  );
}

/** Consultation / prescription document used for print (and mirrored in the PDF builder). */
export function PrescriptionDocument({ clinic, consultation, patient, provider, terms }: Props) {
  const template = getTemplate(consultation.templateId);
  const customFields = template?.sections.flatMap((section) => section.fields).filter((field) => consultation.customFields[field.key] != null && consultation.customFields[field.key] !== "") ?? [];
  return (
    <PrintableLayout
      clinic={clinic}
      title={`${terms.consultation} & ${terms.prescription}`}
      meta={[
        ["Ref", consultation.id],
        ["Date", formatDate(consultation.date)],
        ["Visit", consultation.visitType],
      ]}
      footerNote="Valid only with the provider's signature. In an emergency, contact the clinic or the nearest hospital."
    >
      <KeyValueGrid
        items={[
          [terms.provider, `${provider?.name ?? consultation.provider.name}${provider?.qualification ? `, ${provider.qualification}` : ""}`],
          ["Registration No", provider?.registrationNumber ?? ""],
          ["Patient", `${patient.name} (${patient.id})`],
          ["Age / Gender", `${patient.age} yrs / ${patient.gender}`],
        ]}
      />
      <h3>Vitals</h3>
      <KeyValueGrid items={vitalsSummary(consultation.vitals)} columns={4} />
      <Section title="Chief complaint" text={consultation.chiefComplaint} />
      <Section title="History" text={consultation.history} />
      <Section title="Examination & findings" text={[consultation.examination, consultation.findings].filter(Boolean).join(" ")} />
      {customFields.length > 0 && (
        <>
          <h3>{template?.name}</h3>
          <KeyValueGrid items={customFields.map((field) => [field.label, `${consultation.customFields[field.key]}${field.type === "scale" ? "/10" : field.unit ? ` ${field.unit}` : ""}`])} columns={3} />
        </>
      )}
      <Section title="Diagnosis" text={consultation.diagnosis} />
      {consultation.prescription.length > 0 && (
        <>
          <h3>{terms.prescription}</h3>
          <Box component="table" sx={printStyles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Duration</th>
                <th>Instructions</th>
              </tr>
            </thead>
            <tbody>
              {consultation.prescription.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.dosage}</td>
                  <td>{item.frequency}</td>
                  <td>{item.duration}</td>
                  <td>{item.instructions || "—"}</td>
                </tr>
              ))}
            </tbody>
          </Box>
        </>
      )}
      <Section title="Treatment plan" text={consultation.treatmentPlan} />
      <Section title="Advice" text={consultation.advice} />
      <Section title="Follow-up" text={consultation.followUpDate ? formatDate(consultation.followUpDate, "dddd, DD MMMM YYYY") : ""} />
      <SignatureBlock name={provider?.name ?? consultation.provider.name} label={provider?.designation || terms.provider} />
    </PrintableLayout>
  );
}

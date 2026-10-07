import { apiClient } from "@/lib/api/client";
import { isMockApi } from "@/lib/api/config";
import { datedFileName } from "@/lib/export/download";
import { getSpecialty } from "@/lib/specialties";
import type { ReportResult } from "@/types";

import { billingService } from "./billingService";
import { clinicService } from "./clinicService";
import { consultationService } from "./consultationService";
import { memberService } from "./memberService";
import { patientService } from "./patientService";

export interface GeneratedDocument {
  blob: Blob;
  fileName: string;
  size: number;
}

/**
 * Branded PDF generation. Client mode builds PDFs from data with jsPDF (lazy-loaded);
 * live mode downloads server-rendered PDFs so the backend can also store and send them.
 */
export interface PdfService {
  invoice(invoiceId: string): Promise<GeneratedDocument>;
  receipt(invoiceId: string, paymentId: string): Promise<GeneratedDocument>;
  prescription(consultationId: string): Promise<GeneratedDocument>;
  report(report: ReportResult): Promise<GeneratedDocument>;
}

function toDocument(doc: { output: (type: "blob") => Blob }, fileName: string): GeneratedDocument {
  const blob = doc.output("blob");
  return { blob, fileName, size: blob.size };
}

const clientPdfService: PdfService = {
  async invoice(invoiceId) {
    const [{ buildInvoicePdf }, clinic, branches, invoice] = await Promise.all([import("@/lib/pdf/invoice"), clinicService.get(), clinicService.listBranches(), billingService.get(invoiceId)]);
    const patient = await patientService.get(invoice.patientId);
    return toDocument(buildInvoicePdf({ clinic, branch: branches.find((b) => b.id === invoice.branchId), invoice, patient }), `${invoice.id}.pdf`);
  },
  async receipt(invoiceId, paymentId) {
    const [{ buildReceiptPdf }, clinic, invoice] = await Promise.all([import("@/lib/pdf/invoice"), clinicService.get(), billingService.get(invoiceId)]);
    const payment = invoice.payments.find((item) => item.id === paymentId);
    if (!payment) throw new Error(`Payment ${paymentId} not found on ${invoiceId}`);
    const patient = await patientService.get(invoice.patientId);
    return toDocument(buildReceiptPdf({ clinic, invoice, patient, payment }), `${payment.receiptNumber}.pdf`);
  },
  async prescription(consultationId) {
    const [{ buildPrescriptionPdf }, clinic, consultation] = await Promise.all([import("@/lib/pdf/prescription"), clinicService.get(), consultationService.get(consultationId)]);
    const [patient, provider] = await Promise.all([patientService.get(consultation.patientId), memberService.get(consultation.providerId).catch(() => undefined)]);
    const terms = getSpecialty(provider?.specialty || clinic.primarySpecialty).terminology;
    return toDocument(buildPrescriptionPdf({ clinic, consultation, patient, provider, terms }), `${consultation.id}-prescription.pdf`);
  },
  async report(report) {
    const [{ buildReportPdf }, clinic] = await Promise.all([import("@/lib/pdf/report"), clinicService.get()]);
    return toDocument(buildReportPdf({ clinic, report }), datedFileName(`${report.slug}-report`, "pdf"));
  },
};

async function fetchPdf(url: string, fileName: string, params?: object): Promise<GeneratedDocument> {
  const response = await apiClient.get<Blob>(url, { params, responseType: "blob" });
  return { blob: response.data, fileName, size: response.data.size };
}

const serverPdfService: PdfService = {
  invoice: (id) => fetchPdf(`/documents/invoices/${id}`, `${id}.pdf`),
  receipt: (invoiceId, paymentId) => fetchPdf(`/documents/invoices/${invoiceId}/receipts/${paymentId}`, `${paymentId}.pdf`),
  prescription: (id) => fetchPdf(`/documents/consultations/${id}`, `${id}-prescription.pdf`),
  report: (report) => fetchPdf(`/documents/reports/${report.slug}`, datedFileName(`${report.slug}-report`, "pdf"), report.appliedFilters),
};

export const pdfService = isMockApi ? clientPdfService : serverPdfService;

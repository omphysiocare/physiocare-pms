"use client";

import { useQuery } from "@tanstack/react-query";

import { pdfService } from "@/services/pdfService";
import { whatsappService, type MessageFilters } from "@/services/whatsappService";
import type { MessageRelatedType, MessageType } from "@/types";

import { useAppMutation } from "./useMutationHelpers";

export function useMessages(filters: MessageFilters, enabled = true) {
  return useQuery({ queryKey: ["messages", filters], queryFn: () => whatsappService.list(filters), enabled });
}

export function useMessagePreview(type: MessageType | null, relatedType: MessageRelatedType, relatedId: string) {
  return useQuery({
    queryKey: ["messages", "preview", type, relatedType, relatedId],
    queryFn: () => whatsappService.preview(type!, relatedType, relatedId),
    enabled: !!type && !!relatedId,
  });
}

/** Message types that carry a generated PDF attachment. */
const DOCUMENT_TYPES: Partial<Record<MessageType, true>> = { invoice: true, payment_receipt: true, prescription: true };

export interface SendWhatsAppInput {
  type: MessageType;
  relatedType: MessageRelatedType;
  relatedId: string;
  patientId: string;
  body?: string;
  /** Needed for receipts: the invoice the payment belongs to. */
  invoiceId?: string;
}

/**
 * One-click WhatsApp: generates the branded PDF when the message needs one
 * (invoice, receipt, prescription), then sends through the messaging service.
 */
export function useSendWhatsApp() {
  return useAppMutation(async (input: SendWhatsAppInput) => {
    let attachment = null;
    if (DOCUMENT_TYPES[input.type]) {
      const document =
        input.type === "invoice"
          ? await pdfService.invoice(input.relatedId)
          : input.type === "payment_receipt"
            ? await pdfService.receipt(input.invoiceId ?? "", input.relatedId)
            : await pdfService.prescription(input.relatedId);
      // In production the backend uploads the PDF to storage and returns its URL.
      attachment = { fileName: document.fileName, size: document.size, url: `mock://documents/${document.fileName}` };
    }
    return whatsappService.send({ type: input.type, patientId: input.patientId, relatedType: input.relatedType, relatedId: input.relatedId, body: input.body, attachment });
  });
}

"use client";

import { useState } from "react";

import { downloadBlob } from "@/lib/export/download";
import { useNotify } from "@/providers/NotificationProvider";
import type { GeneratedDocument } from "@/services/pdfService";

/** Generates a PDF through pdfService and downloads it, with loading + feedback. */
export function usePdfDownload() {
  const notify = useNotify();
  const [pending, setPending] = useState(false);

  const download = async (generate: () => Promise<GeneratedDocument>) => {
    setPending(true);
    try {
      const document = await generate();
      downloadBlob(document.blob, document.fileName);
      notify.success(`${document.fileName} downloaded`);
      return document;
    } catch (error) {
      notify.error(error);
      return null;
    } finally {
      setPending(false);
    }
  };

  return { download, pending };
}

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface PrintRequest {
  node: ReactNode;
  title: string;
  container: HTMLElement;
}

interface PrintContextValue {
  /** Prints only the given document; all application UI is hidden. */
  printDocument: (node: ReactNode, title: string) => void;
}

const PrintContext = createContext<PrintContextValue | null>(null);
const PRINTING_CLASS = "is-printing-document";

function printRoot(): HTMLElement {
  let element = document.getElementById("print-root");
  if (!element) {
    element = document.createElement("div");
    element.id = "print-root";
    document.body.appendChild(element);
  }
  return element;
}

/**
 * Single print pipeline for the whole app: the document is rendered into a
 * dedicated `#print-root` (a direct child of <body>) and `@media print`
 * rules hide everything else — sidebar, header, buttons and dialogs.
 */
export default function PrintProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<PrintRequest | null>(null);

  useEffect(() => {
    if (!request) return;
    const previousTitle = document.title;
    const done = () => {
      document.body.classList.remove(PRINTING_CLASS);
      document.title = previousTitle;
      setRequest(null);
    };
    document.title = request.title;
    document.body.classList.add(PRINTING_CLASS);
    window.addEventListener("afterprint", done, { once: true });
    // Let the portal paint before opening the print dialog.
    const timer = window.setTimeout(() => window.print(), 150);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", done);
    };
  }, [request]);

  const printDocument = useCallback((node: ReactNode, title: string) => setRequest({ node, title, container: printRoot() }), []);
  const value = useMemo(() => ({ printDocument }), [printDocument]);

  return (
    <PrintContext.Provider value={value}>
      {children}
      {request ? createPortal(request.node, request.container) : null}
    </PrintContext.Provider>
  );
}

export function usePrint(): PrintContextValue {
  const context = useContext(PrintContext);
  if (!context) throw new Error("usePrint must be used inside PrintProvider");
  return context;
}

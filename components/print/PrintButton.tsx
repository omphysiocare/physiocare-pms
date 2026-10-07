"use client";

import { PrintOutlined } from "@mui/icons-material";
import { Button, type ButtonProps } from "@mui/material";
import type { ReactNode } from "react";

import { usePrint } from "@/providers/PrintProvider";

interface PrintButtonProps extends Omit<ButtonProps, "onClick"> {
  /** Builds the printable document lazily so data is current at click time. */
  document: () => ReactNode | null;
  title: string;
  onPrinted?: () => void;
}

/** Prints only the given document — never the application UI. */
export default function PrintButton({ document, title, onPrinted, children = "Print", ...props }: PrintButtonProps) {
  const { printDocument } = usePrint();
  return (
    <Button
      variant="outlined"
      startIcon={<PrintOutlined />}
      {...props}
      onClick={() => {
        const node = document();
        if (!node) return;
        printDocument(node, title);
        onPrinted?.();
      }}
    >
      {children}
    </Button>
  );
}

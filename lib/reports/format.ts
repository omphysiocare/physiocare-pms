import { formatCurrency, formatCurrencyCompact, formatDate, formatDateTime } from "@/lib/format";
import type { ReportCell, ValueFormat } from "@/types";

/**
 * Formats report values consistently for screen, print and PDF.
 * `pdf` swaps the ₹ symbol for "Rs." (built-in PDF fonts lack the glyph).
 */
export function formatReportValue(value: ReportCell | undefined, format: ValueFormat = "text", compact = false, pdf = false): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" && format !== "date" && format !== "datetime") return value;
  switch (format) {
    case "currency": {
      const text = compact ? formatCurrencyCompact(Number(value)) : formatCurrency(Number(value));
      return pdf ? text.replace("₹", "Rs. ") : text;
    }
    case "percent":
      return `${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 1 })}%`;
    case "number":
      return compact && Math.abs(Number(value)) >= 1000 ? Intl.NumberFormat("en-IN", { notation: "compact" }).format(Number(value)) : Number(value).toLocaleString("en-IN");
    case "date":
      return formatDate(String(value));
    case "datetime":
      return formatDateTime(String(value));
    default:
      return String(value);
  }
}

/** Raw value for CSV (numbers stay numeric, dates stay ISO for spreadsheets). */
export function csvValue(value: ReportCell | undefined, format: ValueFormat = "text"): string {
  if (value === null || value === undefined) return "";
  if (format === "datetime") return formatDateTime(String(value));
  return String(value);
}

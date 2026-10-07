import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

import { formatDateTime } from "@/lib/format";
import type { Clinic } from "@/types";

const ink = "#0F172A";
const muted = "#64748B";
const border = "#E2E8F0";

export const printStyles = {
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 11,
    "& th": { textAlign: "left", padding: "6px 8px", background: "#F1F5F9", color: muted, fontWeight: 700, borderBottom: `1px solid ${border}`, textTransform: "uppercase", fontSize: 9.5, letterSpacing: "0.04em" },
    "& td": { padding: "6px 8px", borderBottom: `1px solid ${border}`, verticalAlign: "top", color: ink },
    "& tfoot td": { fontWeight: 700, background: "#F8FAFC" },
    "& .num": { textAlign: "right", whiteSpace: "nowrap" },
  },
};

export function PrintableHeader({ clinic, title, meta, subtitle }: { clinic: Clinic; title: string; meta?: [string, ReactNode][]; subtitle?: string }) {
  const accent = clinic.branding.accentColor;
  return (
    <Box component="header" sx={{ borderTop: `4px solid ${accent}`, pt: 2, pb: 1.5, mb: 2, borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", gap: 3 }}>
      <Box sx={{ display: "flex", gap: 1.5 }}>
        {clinic.branding.showLogo && clinic.logo && (
          // eslint-disable-next-line @next/next/no-img-element -- data URL logo in a print document
          <img src={clinic.logo} alt="" style={{ width: 56, height: 56, objectFit: "contain" }} />
        )}
        <Box>
          <Typography sx={{ fontSize: 18, fontWeight: 800, color: ink }}>{clinic.name}</Typography>
          {clinic.tagline && <Typography sx={{ fontSize: 10.5, color: muted, fontStyle: "italic" }}>{clinic.tagline}</Typography>}
          <Typography sx={{ fontSize: 10.5, color: muted, mt: 0.5 }}>
            {clinic.address}, {clinic.city}, {clinic.state} {clinic.pincode}
          </Typography>
          {subtitle && <Typography sx={{ fontSize: 10.5, color: muted }}>{subtitle}</Typography>}
          <Typography sx={{ fontSize: 10.5, color: muted }}>{[clinic.phone, clinic.email, clinic.website].filter(Boolean).join(" · ")}</Typography>
          <Typography sx={{ fontSize: 10.5, color: muted }}>
            {[clinic.registrationNumber && `Reg. No: ${clinic.registrationNumber}`, clinic.gstin && `GSTIN: ${clinic.gstin}`].filter(Boolean).join(" · ")}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ textAlign: "right", minWidth: 200 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 800, color: accent, textTransform: "uppercase", letterSpacing: "0.04em" }}>{title}</Typography>
        {meta?.map(([label, value]) => (
          <Typography key={label} sx={{ fontSize: 10.5, color: muted, mt: 0.25 }}>
            {label}: <Box component="span" sx={{ color: ink, fontWeight: 600 }}>{value}</Box>
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

export function PrintableFooter({ clinic, note }: { clinic: Clinic; note?: string }) {
  return (
    <Box component="footer" sx={{ mt: 3, pt: 1, borderTop: `1px solid ${border}`, color: muted, fontSize: 9.5, display: "flex", justifyContent: "space-between", gap: 2 }}>
      <span>{note ?? clinic.billingSettings.invoiceFooter}</span>
      <span>
        {clinic.name} · Printed {formatDateTime(new Date().toISOString())}
      </span>
    </Box>
  );
}

/** Page wrapper for every printable document (A4, clinic letterhead and footer). */
export default function PrintableLayout({
  clinic,
  title,
  meta,
  subtitle,
  footerNote,
  children,
}: {
  clinic: Clinic;
  title: string;
  meta?: [string, ReactNode][];
  subtitle?: string;
  footerNote?: string;
  children: ReactNode;
}) {
  return (
    <Box sx={{ fontFamily: "Inter, Arial, sans-serif", color: ink, background: "#fff", maxWidth: "190mm", mx: "auto", "& h3": { fontSize: 12, fontWeight: 700, m: "14px 0 6px", color: ink } }}>
      <PrintableHeader clinic={clinic} title={title} meta={meta} subtitle={subtitle} />
      {children}
      <PrintableFooter clinic={clinic} note={footerNote} />
    </Box>
  );
}

export function KeyValueGrid({ items, columns = 2 }: { items: [string, ReactNode][]; columns?: number }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: "6px 16px", fontSize: 11, mb: 1.5 }}>
      {items.map(([label, value]) => (
        <Box key={label}>
          <Box sx={{ color: muted, fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</Box>
          <Box sx={{ fontWeight: 600 }}>{value || "—"}</Box>
        </Box>
      ))}
    </Box>
  );
}

export function SignatureBlock({ name, label }: { name: string; label: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 5, breakInside: "avoid" }}>
      <Box sx={{ width: 220, textAlign: "center", borderTop: "1px solid #94A3B8", pt: 0.5 }}>
        <Box sx={{ fontWeight: 700, fontSize: 11 }}>{name}</Box>
        <Box sx={{ color: muted, fontSize: 10 }}>{label}</Box>
      </Box>
    </Box>
  );
}

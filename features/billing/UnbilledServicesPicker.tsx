"use client";

import { Box, Button, Checkbox, FormControlLabel, Typography } from "@mui/material";
import { useState } from "react";

import { useTerminology } from "@/hooks/useClinic";
import { useServiceRecords } from "@/hooks/useServiceRecords";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ServiceRecordWithRelations } from "@/types";

/** Lists the patient's completed, not-yet-invoiced service records for quick billing. */
export default function UnbilledServicesPicker({ patientId, selectedIds, invoiceId, onAdd }: { patientId: string; selectedIds: string[]; invoiceId?: string; onAdd: (records: ServiceRecordWithRelations[]) => void }) {
  const terms = useTerminology();
  const { data: records = [] } = useServiceRecords(patientId || "__none__");
  const [checked, setChecked] = useState<string[]>([]);
  const available = records.filter((item) => item.status === "Completed" && (item.invoiceId === null || item.invoiceId === invoiceId) && !selectedIds.includes(item.id));

  if (!patientId) return null;
  if (available.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No completed, un-invoiced {terms.serviceRecords.toLowerCase()} for this patient.
      </Typography>
    );
  }
  const allChecked = checked.length === available.length;
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, gap: 1, flexWrap: "wrap" }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {available.length} un-invoiced {available.length === 1 ? terms.serviceRecord.toLowerCase() : terms.serviceRecords.toLowerCase()}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button size="small" onClick={() => setChecked(allChecked ? [] : available.map((item) => item.id))}>{allChecked ? "Clear" : "Select all"}</Button>
          <Button size="small" variant="contained" disabled={checked.length === 0} onClick={() => { onAdd(available.filter((item) => checked.includes(item.id))); setChecked([]); }}>
            Add {checked.length || ""} to invoice
          </Button>
        </Box>
      </Box>
      <Box sx={{ maxHeight: 220, overflowY: "auto", border: 1, borderColor: "divider", borderRadius: 2, px: 1.5 }}>
        {available.map((item) => (
          <FormControlLabel
            key={item.id}
            sx={{ display: "flex", m: 0, py: 0.5, borderBottom: 1, borderColor: "divider", "&:last-child": { borderBottom: 0 } }}
            control={<Checkbox size="small" checked={checked.includes(item.id)} onChange={() => setChecked((c) => (c.includes(item.id) ? c.filter((x) => x !== item.id) : [...c, item.id]))} />}
            label={<Typography variant="body2"><strong>{item.id}</strong> · {item.serviceName} (session {item.sessionNumber}) · {formatDate(item.date)} · {formatCurrency(item.amount)}</Typography>}
          />
        ))}
      </Box>
    </Box>
  );
}

import { Box, Typography } from "@mui/material";

import { chartColors } from "@/theme/theme";

export interface BreakdownItem {
  label: string;
  value: number;
  /** Optional secondary text, e.g. a count. */
  meta?: string;
}

interface BreakdownBarsProps {
  items: BreakdownItem[];
  valueFormatter?: (value: number) => string;
  color?: string;
  emptyText?: string;
}

/** Ranked horizontal bars for comparing categories. */
export default function BreakdownBars({
  items,
  valueFormatter = (value) => value.toLocaleString("en-IN"),
  color = chartColors[0],
  emptyText = "No data for this period",
}: BreakdownBarsProps) {
  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
        {emptyText}
      </Typography>
    );
  }
  const max = Math.max(...items.map((item) => item.value), 1);
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 1.75 }}>
      {items.map((item) => (
        <Box component="li" key={item.label} title={`${item.label}: ${valueFormatter(item.value)}`}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 0.75 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 0 }} noWrap>
              {item.label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, flexShrink: 0 }}>
              {valueFormatter(item.value)}
              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
                {item.meta ?? `${total ? Math.round((item.value / total) * 100) : 0}%`}
              </Typography>
            </Typography>
          </Box>
          <Box sx={{ height: 8, borderRadius: 4, bgcolor: "grey.100", overflow: "hidden" }}>
            <Box sx={{ height: "100%", width: `${(item.value / max) * 100}%`, bgcolor: color, borderRadius: 4, minWidth: item.value > 0 ? 4 : 0 }} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

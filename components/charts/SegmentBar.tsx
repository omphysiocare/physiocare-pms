import { Box, Typography } from "@mui/material";

export interface Segment {
  label: string;
  value: number;
  color: string;
}

/** Part-to-whole bar with a labelled legend (counts + percentages). */
export default function SegmentBar({ segments, totalLabel }: { segments: Segment[]; totalLabel?: string }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  return (
    <Box>
      {totalLabel && (
        <Box sx={{ mb: 1.5 }}>
          <Typography sx={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}>{total.toLocaleString("en-IN")}</Typography>
          <Typography variant="caption" color="text.secondary">
            {totalLabel}
          </Typography>
        </Box>
      )}
      <Box sx={{ display: "flex", gap: "2px", height: 12, borderRadius: 6, overflow: "hidden", bgcolor: "grey.100" }}>
        {total > 0 &&
          segments
            .filter((segment) => segment.value > 0)
            .map((segment) => (
              <Box
                key={segment.label}
                title={`${segment.label}: ${segment.value}`}
                sx={{ width: `${(segment.value / total) * 100}%`, bgcolor: segment.color }}
              />
            ))}
      </Box>
      <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, mt: 2, display: "grid", gap: 1.25 }}>
        {segments.map((segment) => (
          <Box component="li" key={segment.label} sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "3px", bgcolor: segment.color, flexShrink: 0 }} />
            <Typography variant="body2" sx={{ flex: 1 }}>
              {segment.label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {segment.value.toLocaleString("en-IN")}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ width: 40, textAlign: "right" }}>
              {total ? Math.round((segment.value / total) * 100) : 0}%
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

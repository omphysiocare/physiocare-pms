import { TrendingDown, TrendingFlat, TrendingUp } from "@mui/icons-material";
import { Box, Card, Skeleton, Typography } from "@mui/material";
import type { ReactNode } from "react";

import { TONES, type Tone } from "@/theme/tones";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone?: Tone;
  helper?: ReactNode;
  /** Percentage change vs a previous period. */
  change?: number | null;
  /** When false, a decrease is shown as good (e.g. expenses). */
  increaseIsGood?: boolean;
  loading?: boolean;
}

export default function StatCard({
  label,
  value,
  icon,
  tone = "primary",
  helper,
  change,
  increaseIsGood = true,
  loading,
}: StatCardProps) {
  const colors = TONES[tone];
  const hasChange = change !== undefined && change !== null && Number.isFinite(change);
  const rounded = hasChange ? Math.round(change * 10) / 10 : 0;
  const good = rounded === 0 ? null : rounded > 0 === increaseIsGood;
  const TrendIcon = rounded > 0 ? TrendingUp : rounded < 0 ? TrendingDown : TrendingFlat;

  return (
    <Card sx={{ height: "100%" }}>
      <Box sx={{ p: { xs: 2, sm: 2.5 }, display: "flex", gap: 2, alignItems: "flex-start" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1, fontSize: { xs: 12, sm: 14 } }} noWrap>
            {label}
          </Typography>
          {loading ? (
            <Skeleton width="60%" height={36} />
          ) : (
            <Typography sx={{ fontSize: { xs: 19, sm: 24 }, fontWeight: 700, lineHeight: 1.2 }} noWrap>
              {value}
            </Typography>
          )}
          {(hasChange || helper) && !loading && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 1, flexWrap: "wrap" }}>
              {hasChange && (
                <Box
                  component="span"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.25,
                    fontSize: 12,
                    fontWeight: 700,
                    color: good === null ? "text.secondary" : good ? "success.main" : "error.main",
                  }}
                >
                  <TrendIcon sx={{ fontSize: 16 }} />
                  {rounded > 0 ? "+" : ""}
                  {rounded}%
                </Box>
              )}
              {helper && (
                <Typography component="span" variant="caption" color="text.secondary">
                  {helper}
                </Typography>
              )}
            </Box>
          )}
        </Box>
        <Box
          sx={{
            width: 44,
            height: 44,
            flexShrink: 0,
            display: { xs: "none", sm: "grid" },
            borderRadius: 2,
            bgcolor: colors.bg,
            color: colors.fg,
            placeItems: "center",
            "& svg": { fontSize: 22 },
          }}
        >
          {icon}
        </Box>
      </Box>
    </Card>
  );
}

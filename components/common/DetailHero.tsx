import { Box, Card, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

import { TONES, type Tone } from "@/theme/tones";

export interface HeroMeta {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}

interface DetailHeroProps {
  /** Avatar node, or an icon rendered in a tinted square. */
  avatar?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  title: ReactNode;
  subtitle?: ReactNode;
  badges?: ReactNode;
  meta?: HeroMeta[];
}

/** Overview card at the top of every detail page. */
export default function DetailHero({ avatar, icon, tone = "primary", title, subtitle, badges, meta }: DetailHeroProps) {
  const toneColors = TONES[tone];
  return (
    <Card sx={{ mb: 3 }}>
      <Box sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} sx={{ alignItems: { sm: "center" } }}>
          {avatar ??
            (icon && (
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  flexShrink: 0,
                  borderRadius: 3,
                  bgcolor: toneColors.bg,
                  color: toneColors.fg,
                  display: "grid",
                  placeItems: "center",
                  "& svg": { fontSize: 30 },
                }}
              >
                {icon}
              </Box>
            ))}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
              <Typography variant="h5" component="h2" sx={{ overflowWrap: "anywhere" }}>
                {title}
              </Typography>
              {badges}
            </Stack>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
        {meta && meta.length > 0 && (
          <Box
            sx={{
              mt: 2.5,
              pt: 2.5,
              borderTop: 1,
              borderColor: "divider",
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: `repeat(${Math.min(meta.length, 4)}, minmax(0, 1fr))` },
            }}
          >
            {meta.map((item) => (
              <Box key={item.label} sx={{ display: "flex", gap: 1.25, alignItems: "center", minWidth: 0 }}>
                <Box sx={{ color: "text.secondary", display: "flex", "& svg": { fontSize: 20 } }}>{item.icon}</Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary" component="p">
                    {item.label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {item.value}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Card>
  );
}

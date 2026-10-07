"use client";

import { LocalHospital } from "@mui/icons-material";
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useClinic, useTerminology } from "@/hooks/useClinic";
import { NAV_SECTIONS, isNavActive, navLabel } from "@/lib/navigation";
import { getSpecialty } from "@/lib/specialties";
import { useAuth } from "@/providers/AuthProvider";
import { colors, layout } from "@/theme/theme";

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { can } = useAuth();
  const terms = useTerminology();
  const { data: clinic } = useClinic();

  return (
    <Box component="nav" aria-label="Main navigation" sx={{ width: layout.sidebarWidth, height: "100%", display: "flex", flexDirection: "column", bgcolor: "background.paper" }}>
      <Box
        component={Link}
        href="/dashboard"
        onClick={onNavigate}
        sx={{ height: layout.headerHeight, flexShrink: 0, display: "flex", alignItems: "center", gap: 1.5, px: 2.5, borderBottom: 1, borderColor: "divider", color: "inherit", textDecoration: "none" }}
      >
        {clinic?.logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded data URL
          <img src={clinic.logo} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
        ) : (
          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "primary.main", color: "primary.contrastText", display: "grid", placeItems: "center" }}>
            <LocalHospital fontSize="small" />
          </Box>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 15, lineHeight: 1.2 }} noWrap>
            {clinic?.name ?? "Practice"}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap component="p">
            {clinic ? getSpecialty(clinic.primarySpecialty).name : "Healthcare PMS"}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", py: 1.5, px: 1.5 }}>
        {NAV_SECTIONS.map((section) => {
          const items = section.items.filter((item) => can(item.permission));
          if (items.length === 0) return null;
          return (
            <Box key={section.title} sx={{ mb: 1.25 }}>
              <Typography variant="overline" sx={{ display: "block", px: 1.5, mb: 0.25, color: colors.textMuted }}>
                {section.title}
              </Typography>
              <List disablePadding>
                {items.map((item) => {
                  const active = isNavActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <ListItemButton
                      key={item.href}
                      component={Link}
                      href={item.href}
                      onClick={onNavigate}
                      selected={active}
                      aria-current={active ? "page" : undefined}
                      sx={{
                        borderRadius: 2,
                        mb: 0.25,
                        minHeight: 38,
                        px: 1.5,
                        color: active ? "primary.main" : "text.secondary",
                        "&:hover": { bgcolor: colors.surfaceMuted, color: "text.primary" },
                        "&.Mui-selected": { bgcolor: colors.primaryLight, color: "primary.main" },
                        "&.Mui-selected:hover": { bgcolor: colors.primaryLight },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 34, color: "inherit" }}>
                        <Icon sx={{ fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText primary={navLabel(item, terms)} slotProps={{ primary: { sx: { fontSize: 14, fontWeight: active ? 600 : 500 } } }} />
                    </ListItemButton>
                  );
                })}
              </List>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

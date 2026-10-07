"use client";

import { Box, Drawer } from "@mui/material";
import { useState, type ReactNode } from "react";

import { layout } from "@/theme/theme";

import AccessGate from "./AccessGate";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }} className="app-shell">
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: "block", lg: "none" } }}
        slotProps={{ paper: { sx: { width: layout.sidebarWidth } } }}
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </Drawer>
      <Drawer
        variant="permanent"
        open
        className="no-print"
        sx={{ display: { xs: "none", lg: "block" } }}
        slotProps={{ paper: { sx: { width: layout.sidebarWidth, borderRight: 1, borderColor: "divider" } } }}
      >
        <Sidebar />
      </Drawer>

      <Header onMenuClick={() => setMobileOpen(true)} />

      <Box
        component="main"
        sx={{
          ml: { xs: 0, lg: `${layout.sidebarWidth}px` },
          pt: `${layout.headerHeight}px`,
          minHeight: "100vh",
        }}
      >
        <Box sx={{ maxWidth: layout.contentMaxWidth, mx: "auto", px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2.5, md: 3.5 } }}>
          <AccessGate>{children}</AccessGate>
        </Box>
      </Box>
    </Box>
  );
}

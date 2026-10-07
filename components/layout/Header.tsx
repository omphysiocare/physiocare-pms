"use client";

import { Menu as MenuIcon } from "@mui/icons-material";
import { AppBar, Box, IconButton, Toolbar } from "@mui/material";

import { layout } from "@/theme/theme";

import BranchSelector from "./BranchSelector";
import GlobalSearch from "./GlobalSearch";
import NotificationsMenu from "./NotificationsMenu";
import UserMenu from "./UserMenu";

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <AppBar
      position="fixed"
      className="no-print"
      color="inherit"
      elevation={0}
      sx={{
        left: { xs: 0, lg: layout.sidebarWidth },
        width: { xs: "100%", lg: `calc(100% - ${layout.sidebarWidth}px)` },
        bgcolor: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(8px)",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Toolbar sx={{ minHeight: `${layout.headerHeight}px !important`, gap: { xs: 1, sm: 1.5 }, px: { xs: 1.5, sm: 3 } }}>
        <IconButton onClick={onMenuClick} aria-label="Open navigation" sx={{ display: { lg: "none" } }}>
          <MenuIcon />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0, display: "flex" }}>
          <GlobalSearch />
        </Box>
        <BranchSelector />
        <NotificationsMenu />
        <UserMenu />
      </Toolbar>
    </AppBar>
  );
}

"use client";

import { KeyboardArrowDown, LogoutOutlined, PersonOutlined, SettingsOutlined, SwapHorizOutlined } from "@mui/icons-material";
import { Box, ButtonBase, Divider, ListItemIcon, Menu, MenuItem, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

import PersonAvatar from "@/components/common/PersonAvatar";
import { useMembers } from "@/hooks/useMembers";
import { isMockApi } from "@/lib/api/config";
import { useAuth } from "@/providers/AuthProvider";
import { useNotify } from "@/providers/NotificationProvider";

export default function UserMenu() {
  const router = useRouter();
  const notify = useNotify();
  const { member, session, switchMember } = useAuth();
  const { data: members = [] } = useMembers();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const name = member?.name ?? "…";

  const go = (href: string) => {
    setAnchor(null);
    router.push(href);
  };

  return (
    <>
      <ButtonBase onClick={(event) => setAnchor(event.currentTarget)} aria-label="Open user menu" sx={{ borderRadius: 2, px: 0.75, py: 0.5, gap: 1.25, "&:hover": { bgcolor: "action.hover" } }}>
        <PersonAvatar name={name} size={36} />
        <Box sx={{ display: { xs: "none", md: "block" }, textAlign: "left" }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{name}</Typography>
          <Typography sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.3 }}>{session?.role}</Typography>
        </Box>
        <KeyboardArrowDown sx={{ display: { xs: "none", md: "block" }, color: "text.secondary", fontSize: 18 }} />
      </ButtonBase>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }} slotProps={{ paper: { sx: { minWidth: 260 } } }}>
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2">{name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {member?.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => go("/settings")}>
          <ListItemIcon>
            <PersonOutlined fontSize="small" />
          </ListItemIcon>
          My account
        </MenuItem>
        <MenuItem onClick={() => go("/clinic")}>
          <ListItemIcon>
            <SettingsOutlined fontSize="small" />
          </ListItemIcon>
          Clinic settings
        </MenuItem>
        {isMockApi && (
          <Box>
            <Divider />
            <Typography variant="overline" color="text.secondary" sx={{ px: 2, pt: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
              <SwapHorizOutlined sx={{ fontSize: 14 }} /> Demo: view as
            </Typography>
            {members
              .filter((m) => m.status === "Active")
              .map((m) => (
                <MenuItem
                  key={m.id}
                  selected={m.id === member?.id}
                  onClick={() => {
                    setAnchor(null);
                    switchMember(m.id);
                    notify.info(`Now viewing as ${m.name} (${m.role})`);
                    router.push("/dashboard");
                  }}
                  sx={{ fontSize: 13 }}
                >
                  {m.name}
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
                    {m.role}
                  </Typography>
                </MenuItem>
              ))}
          </Box>
        )}
        <Divider />
        <MenuItem
          onClick={() => {
            setAnchor(null);
            notify.info("Sign-out will be available once authentication is connected.");
          }}
        >
          <ListItemIcon>
            <LogoutOutlined fontSize="small" />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
}

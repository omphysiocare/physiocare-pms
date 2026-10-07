"use client";

import { ChevronRight } from "@mui/icons-material";
import { List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import Link from "next/link";
import type { ReactNode } from "react";

import SectionCard from "./SectionCard";

export interface QuickAction {
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  hidden?: boolean;
}

export default function QuickActions({ actions, title = "Quick Actions" }: { actions: QuickAction[]; title?: string }) {
  return (
    <SectionCard title={title} disablePadding>
      <List sx={{ p: 1 }}>
        {actions
          .filter((action) => !action.hidden)
          .map((action) => {
            const linkProps = action.href ? { component: Link, href: action.href } : { onClick: action.onClick };
            return (
              <ListItemButton
                key={action.label}
                {...linkProps}
                disabled={action.disabled}
                sx={{ borderRadius: 2, color: action.destructive ? "error.main" : "text.primary" }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: action.destructive ? "error.main" : "primary.main", "& svg": { fontSize: 20 } }}>
                  {action.icon}
                </ListItemIcon>
                <ListItemText primary={action.label} slotProps={{ primary: { sx: { fontSize: 14, fontWeight: 500 } } }} />
                <ChevronRight sx={{ fontSize: 18, color: "text.secondary" }} />
              </ListItemButton>
            );
          })}
      </List>
    </SectionCard>
  );
}

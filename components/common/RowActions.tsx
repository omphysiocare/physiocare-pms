"use client";

import { MoreVert } from "@mui/icons-material";
import { Divider, IconButton, ListItemIcon, Menu, MenuItem, Tooltip } from "@mui/material";
import { useRouter } from "next/navigation";
import { Fragment, useState, type ReactNode } from "react";

export interface RowAction {
  label: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  destructive?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  /** Draws a divider above this action. */
  divider?: boolean;
}

export default function RowActions({ actions, label = "Actions" }: { actions: RowAction[]; label?: string }) {
  const router = useRouter();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const visible = actions.filter((action) => !action.hidden);

  return (
    <>
      <Tooltip title={label}>
        <IconButton
          size="small"
          aria-label={label}
          aria-haspopup="menu"
          onClick={(event) => {
            event.stopPropagation();
            setAnchor(event.currentTarget);
          }}
        >
          <MoreVert fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        onClick={(event) => event.stopPropagation()}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { minWidth: 190 } } }}
      >
        {visible.map((action) => (
          <Fragment key={action.label}>
            {action.divider && <Divider />}
            <MenuItem
              disabled={action.disabled}
              onClick={() => {
                setAnchor(null);
                if (action.href) router.push(action.href);
                action.onClick?.();
              }}
              sx={action.destructive ? { color: "error.main" } : undefined}
            >
              {action.icon && (
                <ListItemIcon sx={{ color: "inherit", "& svg": { fontSize: 18 } }}>{action.icon}</ListItemIcon>
              )}
              {action.label}
            </MenuItem>
          </Fragment>
        ))}
      </Menu>
    </>
  );
}

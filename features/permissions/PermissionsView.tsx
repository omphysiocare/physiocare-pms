"use client";

import { LockOutlined, RestartAltOutlined, SaveOutlined } from "@mui/icons-material";
import { Alert, Box, Button, Card, Checkbox, Chip, Divider, FormControlLabel, List, ListItemButton, ListItemText, Typography } from "@mui/material";
import { useState } from "react";

import { LoadingState, PageHeader, useConfirm } from "@/components/common";
import { useMembers, useResetRole, useRoles, useUpdateRole } from "@/hooks/useMembers";
import { PERMISSION_GROUPS } from "@/lib/auth/permissions";
import { useNotify } from "@/providers/NotificationProvider";
import { MEMBER_ROLES, type MemberRole, type Permission, type RolePermissions } from "@/types";

function RoleEditor({ role, onSaved }: { role: RolePermissions; onSaved: () => void }) {
  const notify = useNotify();
  const update = useUpdateRole();
  const reset = useResetRole();
  const { confirm, dialog } = useConfirm();
  const [selected, setSelected] = useState<Permission[]>(role.permissions);
  const dirty = selected.length !== role.permissions.length || selected.some((p) => !role.permissions.includes(p));

  const toggle = (permission: Permission) => setSelected((current) => (current.includes(permission) ? current.filter((p) => p !== permission) : [...current, permission]));
  const toggleGroup = (permissions: Permission[], on: boolean) => setSelected((current) => (on ? Array.from(new Set([...current, ...permissions])) : current.filter((p) => !permissions.includes(p))));

  const save = async () => {
    try {
      await update.mutateAsync({ role: role.role, permissions: selected });
      notify.success(`${role.role} permissions saved`);
      onSaved();
    } catch (error) {
      notify.error(error);
    }
  };

  const restore = async () => {
    if (!(await confirm({ title: `Reset ${role.role} to defaults?`, description: "Custom changes to this role will be lost.", confirmLabel: "Reset" }))) return;
    try {
      const result = await reset.mutateAsync(role.role);
      setSelected(result.permissions);
      notify.success(`${role.role} reset to default permissions`);
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <Card>
      <Box sx={{ px: 2.5, py: 2, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1">{role.role}</Typography>
          <Typography variant="caption" color="text.secondary">{role.description}</Typography>
        </Box>
        {!role.locked && (
          <>
            <Button color="inherit" startIcon={<RestartAltOutlined />} onClick={restore}>Reset to defaults</Button>
            <Button variant="contained" startIcon={<SaveOutlined />} disabled={!dirty} loading={update.isPending} onClick={save}>Save changes</Button>
          </>
        )}
      </Box>
      <Divider />
      {role.locked && <Alert severity="info" icon={<LockOutlined />} sx={{ m: 2 }}>The Owner role always has full access, including subscription and permissions management.</Alert>}
      <Box sx={{ p: 2.5, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
        {PERMISSION_GROUPS.map((group) => {
          const keys = group.permissions.map((p) => p.key);
          const granted = role.locked ? keys : keys.filter((k) => selected.includes(k));
          return (
            <Box key={group.module} sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.5 }}>
              <FormControlLabel
                control={<Checkbox checked={granted.length === keys.length} indeterminate={granted.length > 0 && granted.length < keys.length} disabled={role.locked} onChange={(e) => toggleGroup(keys, e.target.checked)} />}
                label={<Box><Typography variant="body2" sx={{ fontWeight: 700 }}>{group.module}</Typography><Typography variant="caption" color="text.secondary">{group.description}</Typography></Box>}
              />
              <Box sx={{ display: "flex", flexWrap: "wrap", pl: 3.5 }}>
                {group.permissions.map((permission) => (
                  <FormControlLabel key={permission.key} control={<Checkbox size="small" checked={role.locked || selected.includes(permission.key)} disabled={role.locked} onChange={() => toggle(permission.key)} />} label={<Typography variant="body2" title={permission.key}>{permission.label}</Typography>} />
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>
      {dialog}
    </Card>
  );
}

export default function PermissionsView({ initialRole }: { initialRole?: MemberRole }) {
  const { data: roles = [], isPending } = useRoles();
  const { data: members = [] } = useMembers();
  const [selected, setSelected] = useState<MemberRole>(initialRole ?? "Admin");
  const [version, setVersion] = useState(0);
  const role = roles.find((r) => r.role === selected);

  return (
    <>
      <PageHeader title="Permissions" description="Role-based access. Changes apply to every member with that role. The backend enforces the same rules." />
      {isPending ? (
        <LoadingState />
      ) : (
        <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "260px minmax(0, 1fr)" }, alignItems: "start" }}>
          <Card>
            <List sx={{ p: 1, display: { xs: "flex", md: "block" }, overflowX: "auto" }}>
              {MEMBER_ROLES.map((name) => {
                const entry = roles.find((r) => r.role === name);
                const count = members.filter((m) => m.role === name).length;
                return (
                  <ListItemButton key={name} selected={selected === name} onClick={() => setSelected(name)} sx={{ borderRadius: 2, flexShrink: 0 }}>
                    <ListItemText primary={name} secondary={entry?.locked ? "Full access" : `${entry?.permissions.length ?? 0} permissions`} />
                    {count > 0 && <Chip size="small" label={count} />}
                  </ListItemButton>
                );
              })}
            </List>
          </Card>
          {role && <RoleEditor key={`${role.role}-${version}`} role={role} onSaved={() => setVersion((v) => v + 1)} />}
        </Box>
      )}
    </>
  );
}

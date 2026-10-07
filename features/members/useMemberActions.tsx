"use client";

import { DeleteOutlined, EditOutlined, HowToRegOutlined, PersonOffOutlined, VisibilityOutlined } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useConfirm, type RowAction } from "@/components/common";
import { useRemoveMember, useSetMemberStatus } from "@/hooks/useMembers";
import { useAuth } from "@/providers/AuthProvider";
import { useNotify } from "@/providers/NotificationProvider";
import type { Member } from "@/types";

import MemberDialog from "./MemberDialog";

export function useMemberActions({ redirectAfterRemove }: { redirectAfterRemove?: string } = {}) {
  const router = useRouter();
  const notify = useNotify();
  const { can } = useAuth();
  const { confirm, dialog } = useConfirm();
  const setStatus = useSetMemberStatus();
  const removeMember = useRemoveMember();
  const [editing, setEditing] = useState<Member | null | undefined>(undefined);

  const toggle = async (member: Member) => {
    const next = member.status === "Active" ? "Inactive" : "Active";
    if (next === "Inactive" && !(await confirm({ title: `Deactivate ${member.name}?`, description: "They will lose access immediately. Their records are kept.", confirmLabel: "Deactivate", destructive: true }))) return;
    try {
      await setStatus.mutateAsync({ id: member.id, status: next });
      notify.success(`${member.name} ${next === "Active" ? "activated" : "deactivated"}`);
    } catch (error) {
      notify.error(error);
    }
  };

  const remove = async (member: Member) => {
    if (!(await confirm({ title: `Remove ${member.name}?`, description: "Members with clinical history cannot be removed — deactivate them instead.", confirmLabel: "Remove", destructive: true }))) return;
    try {
      await removeMember.mutateAsync(member.id);
      notify.success(`${member.name} removed`);
      if (redirectAfterRemove) router.push(redirectAfterRemove);
    } catch (error) {
      notify.error(error);
    }
  };

  const rowActions = (member: Member): RowAction[] => [
    { label: "View member", icon: <VisibilityOutlined />, href: `/members/${member.id}` },
    { label: "Edit", icon: <EditOutlined />, onClick: () => setEditing(member), hidden: !can("members.edit") },
    { label: member.status === "Active" ? "Deactivate" : "Activate", icon: member.status === "Active" ? <PersonOffOutlined /> : <HowToRegOutlined />, onClick: () => toggle(member), hidden: !can("members.edit"), divider: true },
    { label: "Remove", icon: <DeleteOutlined />, onClick: () => remove(member), destructive: true, hidden: !can("members.remove") },
  ];

  const dialogs = (
    <>
      {dialog}
      {editing !== undefined && <MemberDialog member={editing ?? undefined} onClose={() => setEditing(undefined)} />}
    </>
  );

  return { rowActions, toggle, remove, openInvite: () => setEditing(null), openEdit: (m: Member) => setEditing(m), dialogs };
}

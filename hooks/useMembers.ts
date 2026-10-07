"use client";

import { useQuery } from "@tanstack/react-query";

import { useBranch } from "@/providers/BranchProvider";
import { memberService, type MemberInput } from "@/services/memberService";
import { permissionService } from "@/services/permissionService";
import type { MemberRole, MemberStatus, Permission } from "@/types";

import { useAppMutation } from "./useMutationHelpers";

export function useMembers() {
  return useQuery({ queryKey: ["members"], queryFn: () => memberService.list() });
}

export function useMember(id: string) {
  return useQuery({ queryKey: ["members", id], queryFn: () => memberService.get(id), enabled: !!id });
}

/** Active, bookable providers — optionally limited to the selected branch. */
export function useProviders(scoped = false) {
  const { branchId } = useBranch();
  const query = useMembers();
  const data = query.data?.filter(
    (member) => member.isProvider && member.status === "Active" && (!scoped || branchId === "all" || member.branchIds.includes(branchId)),
  );
  return { ...query, data };
}

export function useInviteMember() {
  return useAppMutation((input: MemberInput) => memberService.invite(input));
}

export function useUpdateMember(id: string) {
  return useAppMutation((input: MemberInput) => memberService.update(id, input));
}

export function useSetMemberStatus() {
  return useAppMutation(({ id, status }: { id: string; status: MemberStatus }) => memberService.setStatus(id, status));
}

export function useRemoveMember() {
  return useAppMutation((id: string) => memberService.remove(id));
}

export function useRoles() {
  return useQuery({ queryKey: ["roles"], queryFn: () => permissionService.listRoles() });
}

export function useUpdateRole() {
  return useAppMutation(({ role, permissions }: { role: MemberRole; permissions: Permission[] }) => permissionService.updateRole(role, permissions));
}

export function useResetRole() {
  return useAppMutation((role: MemberRole) => permissionService.resetRole(role));
}

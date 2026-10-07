"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";

import { getActorId, setActorId } from "@/lib/api/session";
import { hasAnyPermission, hasPermission } from "@/lib/auth/permissions";
import { memberService } from "@/services/memberService";
import { permissionService } from "@/services/permissionService";
import type { Member, Permission, Session } from "@/types";

interface AuthContextValue {
  session: Session | undefined;
  member: Member | undefined;
  ready: boolean;
  can: (permission: Permission | Permission[]) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  /** Demo only: act as another member to preview role-based access. */
  switchMember: (memberId: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Session & permission context. With a real backend, `getSession` is backed by
 * the auth token; the UI only hides actions — the API enforces authorization.
 */
export default function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const sessionQuery = useQuery({ queryKey: ["session", getActorId()], queryFn: () => permissionService.getSession(), staleTime: Infinity });
  const membersQuery = useQuery({ queryKey: ["members"], queryFn: () => memberService.list() });
  const session = sessionQuery.data;
  const permissions = useMemo(() => session?.permissions ?? [], [session]);

  const can = useCallback((permission: Permission | Permission[]) => hasPermission(permissions, permission), [permissions]);
  const canAny = useCallback((list: Permission[]) => hasAnyPermission(permissions, list), [permissions]);
  const switchMember = useCallback(
    (memberId: string) => {
      setActorId(memberId);
      void queryClient.invalidateQueries();
    },
    [queryClient],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      member: membersQuery.data?.find((m) => m.id === session?.memberId),
      ready: Boolean(session),
      can,
      canAny,
      switchMember,
    }),
    [session, membersQuery.data, can, canAny, switchMember],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

/** Renders children only when the current member has the permission(s). */
export function Can({ permission, children, fallback = null }: { permission: Permission | Permission[]; children: ReactNode; fallback?: ReactNode }) {
  const { can } = useAuth();
  return <>{can(permission) ? children : fallback}</>;
}

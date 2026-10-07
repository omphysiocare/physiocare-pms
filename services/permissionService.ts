import { http } from "@/lib/api/client";
import { isMockApi } from "@/lib/api/config";
import { ApiError } from "@/lib/api/errors";
import { logActivity } from "@/lib/api/mock/audit";
import { commit, getDb } from "@/lib/api/mock/db";
import { run } from "@/lib/api/mock/run";
import { getActorId } from "@/lib/api/session";
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/auth/permissions";
import { PERMISSIONS, type MemberRole, type Permission, type RolePermissions, type Session } from "@/types";

export interface PermissionService {
  listRoles(): Promise<RolePermissions[]>;
  updateRole(role: MemberRole, permissions: Permission[]): Promise<RolePermissions>;
  resetRole(role: MemberRole): Promise<RolePermissions>;
  /** Session of the signed-in member, including effective permissions. */
  getSession(): Promise<Session>;
}

const mockPermissionService: PermissionService = {
  listRoles: () => run(() => getDb().roles),
  updateRole: (role, permissions) =>
    run(() => {
      const entry = getDb().roles.find((item) => item.role === role);
      if (!entry) throw new ApiError(`Unknown role ${role}`, 404);
      if (entry.locked) throw new ApiError("The Owner role always has full access and cannot be changed.", 409);
      entry.permissions = PERMISSIONS.filter((permission) => permissions.includes(permission));
      logActivity("updated", "Permissions", role, `Updated permissions for ${role} (${entry.permissions.length} granted)`);
      commit();
      return entry;
    }),
  resetRole: (role) =>
    run(() => {
      const entry = getDb().roles.find((item) => item.role === role);
      if (!entry) throw new ApiError(`Unknown role ${role}`, 404);
      entry.permissions = [...DEFAULT_ROLE_PERMISSIONS[role].permissions];
      logActivity("updated", "Permissions", role, `Reset ${role} permissions to defaults`);
      commit();
      return entry;
    }),
  getSession: () =>
    run(() => {
      const db = getDb();
      const member = db.members.find((m) => m.id === getActorId()) ?? db.members[0];
      const role = db.roles.find((r) => r.role === member.role);
      return {
        memberId: member.id,
        clinicId: db.clinic.id,
        role: member.role,
        permissions: role?.locked ? [...PERMISSIONS] : (role?.permissions ?? []),
      };
    }, 60),
};

const httpPermissionService: PermissionService = {
  listRoles: () => http.get<RolePermissions[]>("/roles"),
  updateRole: (role, permissions) => http.put<RolePermissions>(`/roles/${role}`, { permissions }),
  resetRole: (role) => http.post<RolePermissions>(`/roles/${role}/reset`),
  getSession: () => http.get<Session>("/auth/session"),
};

export const permissionService = isMockApi ? mockPermissionService : httpPermissionService;

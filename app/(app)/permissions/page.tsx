import type { Metadata } from "next";

import PermissionsView from "@/features/permissions/PermissionsView";
import { firstParam } from "@/lib/params";
import { MEMBER_ROLES, type MemberRole } from "@/types";

export const metadata: Metadata = { title: "Permissions" };

export default async function PermissionsPage(props: PageProps<"/permissions">) {
  const role = firstParam((await props.searchParams).role) as MemberRole | undefined;
  return <PermissionsView initialRole={role && MEMBER_ROLES.includes(role) ? role : undefined} />;
}

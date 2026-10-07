import type { Metadata } from "next";

import MemberListView from "@/features/members/MemberListView";

export const metadata: Metadata = { title: "Members" };

export default function MembersPage() {
  return <MemberListView />;
}

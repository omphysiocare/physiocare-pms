import type { Metadata } from "next";

import MemberDetailView from "@/features/members/MemberDetailView";

export const metadata: Metadata = { title: "Member" };

export default async function MemberPage(props: PageProps<"/members/[id]">) {
  const { id } = await props.params;
  return <MemberDetailView id={decodeURIComponent(id)} />;
}

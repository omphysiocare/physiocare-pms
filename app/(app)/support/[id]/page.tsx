import type { Metadata } from "next";

import TicketDetailView from "@/features/support/TicketDetailView";

export const metadata: Metadata = { title: "Support ticket" };

export default async function TicketPage(props: PageProps<"/support/[id]">) {
  const { id } = await props.params;
  return <TicketDetailView id={decodeURIComponent(id)} />;
}

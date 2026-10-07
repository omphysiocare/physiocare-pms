import type { Metadata } from "next";

import ExpenseDetailView from "@/features/expenses/ExpenseDetailView";

export async function generateMetadata(props: PageProps<"/expenses/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: `Expense ${decodeURIComponent(id)}` };
}

export default async function ExpenseDetailPage(props: PageProps<"/expenses/[id]">) {
  const { id } = await props.params;
  return <ExpenseDetailView id={decodeURIComponent(id)} />;
}

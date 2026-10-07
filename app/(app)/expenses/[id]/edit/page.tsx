import type { Metadata } from "next";

import { ExpenseEditView } from "@/features/expenses/ExpenseFormViews";

export const metadata: Metadata = { title: "Edit Expense" };

export default async function EditExpensePage(props: PageProps<"/expenses/[id]/edit">) {
  const { id } = await props.params;
  return <ExpenseEditView id={decodeURIComponent(id)} />;
}

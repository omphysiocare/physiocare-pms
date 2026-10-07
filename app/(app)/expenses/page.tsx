import type { Metadata } from "next";

import ExpenseListView from "@/features/expenses/ExpenseListView";

export const metadata: Metadata = { title: "Expenses" };

export default function ExpensesPage() {
  return <ExpenseListView />;
}

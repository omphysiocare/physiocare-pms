import type { Metadata } from "next";

import { ExpenseCreateView } from "@/features/expenses/ExpenseFormViews";

export const metadata: Metadata = { title: "Add Expense" };

export default function NewExpensePage() {
  return <ExpenseCreateView />;
}

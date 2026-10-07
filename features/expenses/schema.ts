import dayjs from "dayjs";
import { z } from "zod";

import { today } from "@/lib/dates";
import { isoDate, optionalText, requiredNumber, requiredText, selectOne } from "@/lib/validation";
import type { ExpenseInput } from "@/services/expenseService";
import { EXPENSE_CATEGORIES, EXPENSE_STATUSES, PAYMENT_METHODS, type Expense } from "@/types";

export const expenseSchema = z.object({
  date: isoDate("Expense date").refine((value) => !dayjs(value).isAfter(dayjs().add(1, "year")), "Date is too far in the future"),
  category: selectOne(EXPENSE_CATEGORIES, "Category"),
  description: requiredText("Description", 200),
  vendor: optionalText(100),
  paymentMethod: selectOne(PAYMENT_METHODS, "Payment method"),
  paidBy: requiredText("Paid by", 80),
  amount: requiredNumber("Amount", { min: 1, max: 10000000 }),
  reference: optionalText(80),
  status: selectOne(EXPENSE_STATUSES, "Status"),
  branchId: z.string().min(1, "Select a branch"),
  notes: optionalText(1000),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

export function emptyExpenseValues(paidBy = "", branchId = ""): ExpenseFormValues {
  return {
    date: today(),
    category: "Medical Supplies",
    description: "",
    vendor: "",
    paymentMethod: "UPI",
    paidBy,
    // Starts empty; the schema reports "Amount is required" until filled in.
    amount: null as unknown as number,
    reference: "",
    status: "Paid",
    branchId,
    notes: "",
  };
}

export function expenseToFormValues(expense: Expense): ExpenseFormValues {
  return {
    date: expense.date,
    category: expense.category,
    description: expense.description,
    vendor: expense.vendor,
    paymentMethod: expense.paymentMethod,
    paidBy: expense.paidBy,
    amount: expense.amount,
    reference: expense.reference,
    status: expense.status,
    branchId: expense.branchId,
    notes: expense.notes,
  };
}

export function formValuesToExpenseInput(values: ExpenseFormValues, archived = false): ExpenseInput {
  return { ...values, archived };
}

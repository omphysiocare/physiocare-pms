import type { BaseEntity, ISODate, PaymentMethod, TenantScoped } from "./common";

export const EXPENSE_CATEGORIES = [
  "Rent",
  "Electricity",
  "Internet",
  "Staff Salary",
  "Equipment",
  "Medical Supplies",
  "Office Supplies",
  "Maintenance",
  "Marketing",
  "Software",
  "Insurance",
  "Other",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_STATUSES = ["Paid", "Pending", "Cancelled"] as const;
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];

export interface Expense extends BaseEntity, TenantScoped {
  date: ISODate;
  category: ExpenseCategory;
  description: string;
  vendor: string;
  paymentMethod: PaymentMethod;
  paidBy: string;
  amount: number;
  reference: string;
  status: ExpenseStatus;
  archived: boolean;
  notes: string;
}

import { http } from "@/lib/api/client";
import { isMockApi } from "@/lib/api/config";
import { logActivity } from "@/lib/api/mock/audit";
import { findOrThrow, inBranch, insertRecord, removeRecord, updateRecord } from "@/lib/api/mock/crud";
import { getDb } from "@/lib/api/mock/db";
import { run } from "@/lib/api/mock/run";
import { formatCurrency } from "@/lib/format";
import { ID_PREFIX } from "@/lib/ids";
import type { CreateInput, Expense, ExpenseStatus } from "@/types";

import type { ListScope } from "./types";

export type ExpenseInput = CreateInput<Expense>;

export interface ExpenseService {
  list(scope?: ListScope & { includeArchived?: boolean }): Promise<Expense[]>;
  get(id: string): Promise<Expense>;
  create(input: ExpenseInput): Promise<Expense>;
  update(id: string, input: ExpenseInput): Promise<Expense>;
  updateStatus(id: string, status: ExpenseStatus): Promise<Expense>;
  setArchived(id: string, archived: boolean): Promise<Expense>;
  remove(id: string): Promise<void>;
}

const RESOURCE = "Expense";

const mockExpenseService: ExpenseService = {
  list: (scope) =>
    run(() =>
      getDb()
        .expenses.filter((expense) => inBranch(scope?.branchId, expense.branchId) && (scope?.includeArchived || !expense.archived))
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
    ),
  get: (id) => run(() => findOrThrow(getDb().expenses, id, RESOURCE)),
  create: (input) =>
    run(() => {
      const expense = insertRecord<Expense>(getDb().expenses, ID_PREFIX.expense, input);
      logActivity("created", "Expenses", expense.id, `Added expense ${expense.description} (${formatCurrency(expense.amount)})`, expense.branchId);
      return expense;
    }),
  update: (id, input) =>
    run(() => {
      const expense = updateRecord(getDb().expenses, id, input, RESOURCE);
      logActivity("updated", "Expenses", id, `Updated expense ${expense.description}`, expense.branchId);
      return expense;
    }),
  updateStatus: (id, status) =>
    run(() => {
      const expense = updateRecord(getDb().expenses, id, { status }, RESOURCE);
      logActivity("status_changed", "Expenses", id, `Marked expense ${id} as ${status}`, expense.branchId);
      return expense;
    }),
  setArchived: (id, archived) =>
    run(() => {
      const expense = updateRecord(getDb().expenses, id, { archived }, RESOURCE);
      logActivity("updated", "Expenses", id, `${archived ? "Archived" : "Restored"} expense ${id}`, expense.branchId);
      return expense;
    }),
  remove: (id) =>
    run(() => {
      const removed = removeRecord(getDb().expenses, id, RESOURCE);
      logActivity("deleted", "Expenses", id, `Deleted expense ${removed.description} (${formatCurrency(removed.amount)})`, removed.branchId);
    }),
};

const httpExpenseService: ExpenseService = {
  list: (scope) => http.get<Expense[]>("/expenses", scope),
  get: (id) => http.get<Expense>(`/expenses/${id}`),
  create: (input) => http.post<Expense>("/expenses", input),
  update: (id, input) => http.put<Expense>(`/expenses/${id}`, input),
  updateStatus: (id, status) => http.patch<Expense>(`/expenses/${id}/status`, { status }),
  setArchived: (id, archived) => http.patch<Expense>(`/expenses/${id}/archive`, { archived }),
  remove: (id) => http.delete(`/expenses/${id}`),
};

export const expenseService = isMockApi ? mockExpenseService : httpExpenseService;

"use client";

import { useQuery } from "@tanstack/react-query";

import { useBranch } from "@/providers/BranchProvider";
import { expenseService, type ExpenseInput } from "@/services/expenseService";
import type { ExpenseStatus } from "@/types";

import { useAppMutation } from "./useMutationHelpers";

export function useExpenses(includeArchived = false) {
  const { branchId } = useBranch();
  return useQuery({ queryKey: ["expenses", "list", branchId, includeArchived], queryFn: () => expenseService.list({ branchId, includeArchived }) });
}

export function useExpense(id: string) {
  return useQuery({ queryKey: ["expenses", "detail", id], queryFn: () => expenseService.get(id), enabled: !!id });
}

export function useCreateExpense() {
  return useAppMutation((input: ExpenseInput) => expenseService.create(input));
}

export function useUpdateExpense(id: string) {
  return useAppMutation((input: ExpenseInput) => expenseService.update(id, input));
}

export function useUpdateExpenseStatus() {
  return useAppMutation(({ id, status }: { id: string; status: ExpenseStatus }) => expenseService.updateStatus(id, status));
}

export function useArchiveExpense() {
  return useAppMutation(({ id, archived }: { id: string; archived: boolean }) => expenseService.setArchived(id, archived));
}

export function useDeleteExpense() {
  return useAppMutation((id: string) => expenseService.remove(id));
}

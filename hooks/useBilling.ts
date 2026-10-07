"use client";

import { useQuery } from "@tanstack/react-query";

import { useBranch } from "@/providers/BranchProvider";
import { billingService, paymentService, type CreateInvoiceInput, type InvoiceInput, type RefundInput } from "@/services/billingService";
import type { PaymentInput } from "@/types";

import { useAppMutation } from "./useMutationHelpers";

export function useInvoices(patientId?: string) {
  const { branchId } = useBranch();
  const filters = patientId ? { patientId } : { branchId };
  return useQuery({ queryKey: ["invoices", "list", filters], queryFn: () => billingService.list(filters) });
}

export function useInvoice(id: string) {
  return useQuery({ queryKey: ["invoices", "detail", id], queryFn: () => billingService.get(id), enabled: !!id });
}

export function usePayments(patientId?: string) {
  const { branchId } = useBranch();
  const filters = patientId ? { patientId } : { branchId };
  return useQuery({ queryKey: ["payments", "list", filters], queryFn: () => paymentService.list(filters) });
}

export function useCreateInvoice() {
  return useAppMutation((input: CreateInvoiceInput) => billingService.create(input));
}

export function useUpdateInvoice(id: string) {
  return useAppMutation((input: InvoiceInput) => billingService.update(id, input));
}

export function useCancelInvoice() {
  return useAppMutation(({ id, reason }: { id: string; reason: string }) => billingService.cancel(id, reason));
}

export function useDeleteInvoice() {
  return useAppMutation((id: string) => billingService.remove(id));
}

export function useRecordPayment(invoiceId: string) {
  return useAppMutation((payment: PaymentInput) => paymentService.record(invoiceId, payment));
}

export function useRefundPayment(invoiceId: string) {
  return useAppMutation((input: RefundInput) => paymentService.refund(invoiceId, input));
}

export function useRemovePayment(invoiceId: string) {
  return useAppMutation((paymentId: string) => paymentService.remove(invoiceId, paymentId));
}

"use client";

import { useQuery } from "@tanstack/react-query";

import { subscriptionService } from "@/services/subscriptionService";
import { supportService, type CreateTicketInput } from "@/services/supportService";
import type { BillingCycle, TicketPriority, TicketStatus } from "@/types";

import { useAppMutation } from "./useMutationHelpers";

export function useSubscription() {
  return useQuery({ queryKey: ["subscription"], queryFn: () => subscriptionService.getOverview() });
}

export function useChangePlan() {
  return useAppMutation(({ planId, billingCycle }: { planId: string; billingCycle: BillingCycle }) => subscriptionService.changePlan(planId, billingCycle));
}

export function useCancelSubscription() {
  return useAppMutation(() => subscriptionService.cancel());
}

export function useResumeSubscription() {
  return useAppMutation(() => subscriptionService.resume());
}

export function useFaqs() {
  return useQuery({ queryKey: ["faqs"], queryFn: () => supportService.listFaqs(), staleTime: Infinity });
}

export function useTickets() {
  return useQuery({ queryKey: ["tickets"], queryFn: () => supportService.listTickets() });
}

export function useTicket(id: string) {
  return useQuery({ queryKey: ["tickets", id], queryFn: () => supportService.getTicket(id), enabled: !!id });
}

export function useCreateTicket() {
  return useAppMutation((input: CreateTicketInput) => supportService.createTicket(input));
}

export function useReplyTicket(id: string) {
  return useAppMutation((body: string) => supportService.reply(id, body));
}

export function useUpdateTicket(id: string) {
  return useAppMutation((patch: { status?: TicketStatus; priority?: TicketPriority }) => supportService.updateTicket(id, patch));
}

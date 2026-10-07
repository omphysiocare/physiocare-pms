"use client";

import { useMutation, useQueryClient, type MutationFunction } from "@tanstack/react-query";

/**
 * Records are heavily cross-linked (an appointment changes the dashboard,
 * patient profile, reports…), so every mutation refreshes all active queries —
 * also after failures, which can still be recorded (e.g. a failed WhatsApp send).
 */
export function useAppMutation<TData, TVariables = void>(mutationFn: MutationFunction<TData, TVariables>) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn, onSettled: () => queryClient.invalidateQueries() });
}

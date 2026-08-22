import { useMutation } from "@tanstack/react-query";
import { ai } from "@/lib/api/endpoints";
import type { AiPlanInput } from "@/lib/types";

export function useAiHomeChat() {
  return useMutation({
    mutationFn: (message: string) => ai.homeChat(message),
  });
}

export function useAiPlan() {
  return useMutation({
    mutationFn: (data: AiPlanInput) => ai.plan(data),
  });
}

export function useAiSchedule() {
  return useMutation({
    mutationFn: ({ prompt, tripId }: { prompt: string; tripId?: number }) => ai.schedule(prompt, tripId),
  });
}

export function useAiRecommendations() {
  return useMutation({
    mutationFn: ({ tripId, limit = 3 }: { tripId: number; limit?: number }) => ai.recommend(tripId, limit),
  });
}

export function useAiOptimize() {
  return useMutation({
    mutationFn: ({ tripId, targetBudget }: { tripId: number; targetBudget: number }) =>
      ai.optimize(tripId, targetBudget),
  });
}

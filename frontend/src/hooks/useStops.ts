import { useMutation, useQueryClient } from "@tanstack/react-query";
import { stopActivities, stops } from "@/lib/api/endpoints";
import type { AddStopActivityInput, CreateStopInput, UpdateStopActivityInput, UpdateStopInput } from "@/lib/types";

function invalidateTrip(queryClient: ReturnType<typeof useQueryClient>, tripId: number) {
  queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
  queryClient.invalidateQueries({ queryKey: ["trip", tripId, "budget"] });
  queryClient.invalidateQueries({ queryKey: ["trip", tripId, "itinerary"] });
}

export function useAddStop(tripId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStopInput) => stops.add(tripId, data),
    onSuccess: () => invalidateTrip(queryClient, tripId),
  });
}

export function useUpdateStop(tripId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stopId, data }: { stopId: number; data: UpdateStopInput }) => stops.update(stopId, data),
    onSuccess: () => invalidateTrip(queryClient, tripId),
  });
}

export function useDeleteStop(tripId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stopId: number) => stops.remove(stopId),
    onSuccess: () => invalidateTrip(queryClient, tripId),
  });
}

export function useReorderStops(tripId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedStopIds: number[]) => stops.reorder(tripId, orderedStopIds),
    onSuccess: () => invalidateTrip(queryClient, tripId),
  });
}

export function useAddStopActivity(tripId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stopId, data }: { stopId: number; data: AddStopActivityInput }) => stops.addActivity(stopId, data),
    onSuccess: () => invalidateTrip(queryClient, tripId),
  });
}

export function useUpdateStopActivity(tripId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStopActivityInput }) => stopActivities.update(id, data),
    onSuccess: () => invalidateTrip(queryClient, tripId),
  });
}

export function useRemoveStopActivity(tripId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => stopActivities.remove(id),
    onSuccess: () => invalidateTrip(queryClient, tripId),
  });
}

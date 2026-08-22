import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { trips } from "@/lib/api/endpoints";
import type { UpdateTripInput } from "@/lib/types";

function invalidateTrip(queryClient: ReturnType<typeof useQueryClient>, id: number) {
  queryClient.invalidateQueries({ queryKey: ["trip", id] });
  queryClient.invalidateQueries({ queryKey: ["trip", id, "budget"] });
  queryClient.invalidateQueries({ queryKey: ["trip", id, "itinerary"] });
  queryClient.invalidateQueries({ queryKey: ["trips"] });
}

export function useTrip(id: number) {
  return useQuery({
    queryKey: ["trip", id],
    queryFn: () => trips.get(id),
    enabled: Number.isFinite(id),
  });
}

export function useUpdateTrip(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTripInput) => trips.update(id, data),
    onSuccess: () => invalidateTrip(queryClient, id),
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => trips.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useShareTrip(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => trips.share(id),
    onSuccess: () => invalidateTrip(queryClient, id),
  });
}

export function useUnshareTrip(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => trips.unshare(id),
    onSuccess: () => invalidateTrip(queryClient, id),
  });
}

export function useCopyTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => trips.copy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

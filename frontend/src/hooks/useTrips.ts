import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { trips } from "@/lib/api/endpoints";
import type { CreateTripInput, TripScope } from "@/lib/types";

export function useTrips(params: { q?: string; scope?: TripScope }) {
  return useQuery({
    queryKey: ["trips", params],
    queryFn: () => trips.list({ ...params, limit: 50 }),
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTripInput) => trips.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

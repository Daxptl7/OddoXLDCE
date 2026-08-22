import { useQuery } from "@tanstack/react-query";
import { trips } from "@/lib/api/endpoints";

export function useItinerary(id: number) {
  return useQuery({
    queryKey: ["trip", id, "itinerary"],
    queryFn: () => trips.itinerary(id),
    enabled: Number.isFinite(id),
  });
}

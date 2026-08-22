import { useQuery } from "@tanstack/react-query";
import { trips } from "@/lib/api/endpoints";

export function useBudget(id: number) {
  return useQuery({
    queryKey: ["trip", id, "budget"],
    queryFn: () => trips.budget(id),
    enabled: Number.isFinite(id),
  });
}

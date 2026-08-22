import { useQuery } from "@tanstack/react-query";
import { dashboard } from "@/lib/api/endpoints";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboard.get(),
  });
}

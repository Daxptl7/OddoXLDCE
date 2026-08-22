import { useQuery } from "@tanstack/react-query";
import { catalogue } from "@/lib/api/endpoints";

export function useCities(q: string) {
  return useQuery({
    queryKey: ["cities", q],
    queryFn: () => catalogue.cities({ q, sort: "popularity", limit: 20 }),
  });
}

export function useCityActivities(cityId: number | null, q: string) {
  return useQuery({
    queryKey: ["city-activities", cityId, q],
    queryFn: () => catalogue.cityActivities(cityId as number, { q, limit: 30 }),
    enabled: cityId !== null,
  });
}

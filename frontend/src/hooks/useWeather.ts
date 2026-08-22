import { useQuery } from "@tanstack/react-query";
import { weather } from "@/lib/api/endpoints";

export function useCityWeather(cityId?: number | null, startDate?: string | null, endDate?: string | null) {
  return useQuery({
    queryKey: ["weather", "city", cityId, startDate, endDate],
    queryFn: () => weather.getCityWeather(cityId!, startDate || undefined, endDate || undefined),
    enabled: Boolean(cityId && Number.isFinite(cityId)),
    staleTime: 10 * 60 * 1000,
  });
}

export function useTripWeather(tripId: number) {
  return useQuery({
    queryKey: ["weather", "trip", tripId],
    queryFn: () => weather.getTripWeather(tripId),
    enabled: Number.isFinite(tripId),
    staleTime: 10 * 60 * 1000,
  });
}

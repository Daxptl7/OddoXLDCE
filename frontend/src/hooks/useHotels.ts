import { useQuery } from "@tanstack/react-query";
import { hotels } from "@/lib/api/endpoints";

export function useHotels(params: {
  cityId?: number | null;
  cityName?: string;
  country?: string;
  q?: string;
  stars?: number;
  maxPrice?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["hotels", params],
    queryFn: () => hotels.list({
      cityId: params.cityId || undefined,
      cityName: params.cityName,
      country: params.country,
      q: params.q || undefined,
      stars: params.stars || undefined,
      maxPrice: params.maxPrice || undefined,
      limit: params.limit || undefined,
    }),
    enabled: Boolean(params.cityId || params.cityName),
    staleTime: 30 * 60 * 1000,
  });
}

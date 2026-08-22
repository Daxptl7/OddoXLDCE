import { useQuery } from "@tanstack/react-query";
import { ai } from "@/lib/api/endpoints";
import type { AiFoodSuggestionsInput } from "@/lib/types";

export function useFoodSuggestions(input: AiFoodSuggestionsInput, enabled: boolean = true) {
  return useQuery({
    queryKey: ["food-suggestions", input],
    queryFn: () => ai.foodSuggestions(input),
    enabled: Boolean(enabled && input.cityName),
    staleTime: 30 * 60 * 1000,
  });
}

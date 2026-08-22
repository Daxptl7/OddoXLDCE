import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookings } from "@/lib/api/endpoints";
import type { BookingStatus, CreateBookingInput } from "@/lib/types";

export function useBookings(params: { status?: BookingStatus; scope?: "all" | "upcoming" | "past" } = {}) {
  return useQuery({
    queryKey: ["bookings", params],
    queryFn: () => bookings.list({ ...params, limit: 50 }),
  });
}

/** Everything a new booking touches: the list, the dashboard, the guide's calendar. */
function invalidateBookingViews(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["bookings"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["guides"] });
  queryClient.invalidateQueries({ queryKey: ["guide"] });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBookingInput) => bookings.create(data),
    onSuccess: () => invalidateBookingViews(queryClient),
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) => bookings.cancel(id, notes),
    onSuccess: () => invalidateBookingViews(queryClient),
  });
}

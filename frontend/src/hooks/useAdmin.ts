import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { admin } from "@/lib/api/endpoints";
import type { AdminUpdateBookingInput, BookingStatus, UserRole } from "@/lib/types";

export function useAdminStats() {
  return useQuery({ queryKey: ["admin", "stats"], queryFn: () => admin.stats() });
}

export function useAdminUsers(params: { q?: string; role?: UserRole }) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => admin.users({ ...params, limit: 50 }),
  });
}

export function useAdminGuides(params: { q?: string; status?: "all" | "active" | "inactive" | "unverified" }) {
  return useQuery({
    queryKey: ["admin", "guides", params],
    queryFn: () => admin.guides({ ...params, limit: 50 }),
  });
}

export function useAdminBookings(params: { q?: string; status?: BookingStatus; guideId?: number }) {
  return useQuery({
    queryKey: ["admin", "bookings", params],
    queryFn: () => admin.bookings({ ...params, limit: 50 }),
  });
}

/** Role changes ripple into the guide directory, so invalidate broadly. */
function invalidateAdminViews(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["admin"] });
  queryClient.invalidateQueries({ queryKey: ["guides"] });
  queryClient.invalidateQueries({ queryKey: ["bookings"] });
}

export function useSetUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      ...data
    }: {
      userId: number;
      role: UserRole;
      cityId?: number;
      dailyRate?: number;
    }) => admin.setUserRole(userId, data),
    onSuccess: () => invalidateAdminViews(queryClient),
  });
}

export function useUpdateGuideAsAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      guideId,
      ...data
    }: {
      guideId: number;
      isActive?: boolean;
      isVerified?: boolean;
      cityId?: number;
      dailyRate?: number;
    }) => admin.updateGuide(guideId, data),
    onSuccess: () => invalidateAdminViews(queryClient),
  });
}

export function useUpdateBookingAsAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, ...data }: { bookingId: number } & AdminUpdateBookingInput) =>
      admin.updateBooking(bookingId, data),
    onSuccess: () => invalidateAdminViews(queryClient),
  });
}

export function useDeleteBookingAsAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: number) => admin.deleteBooking(bookingId),
    onSuccess: () => invalidateAdminViews(queryClient),
  });
}

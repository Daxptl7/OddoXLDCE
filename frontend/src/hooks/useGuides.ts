import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { guides } from "@/lib/api/endpoints";
import type { BookingStatus, GuideProfileInput } from "@/lib/types";

export interface GuideFilters {
  q?: string;
  cityId?: number;
  language?: string;
  maxRate?: number;
  startDate?: string;
  endDate?: string;
  sort?: "rating" | "price" | "experience";
}

export function useGuides(filters: GuideFilters, enabled = true) {
  return useQuery({
    queryKey: ["guides", filters],
    queryFn: () => guides.list({ ...filters, limit: 50 }),
    enabled,
  });
}

export function useGuide(id: number | null) {
  return useQuery({
    queryKey: ["guide", id],
    queryFn: () => guides.get(id!),
    enabled: id !== null,
  });
}

// ── The signed-in guide's own workspace ──

export function useMyGuideProfile(enabled = true) {
  return useQuery({ queryKey: ["guide", "me"], queryFn: () => guides.me(), enabled });
}

export function useUpdateMyGuideProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<GuideProfileInput> & { isActive?: boolean }) => guides.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guide"] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}

export function useMyAssignments(params: { status?: BookingStatus; scope?: "all" | "upcoming" | "past" }) {
  return useQuery({
    queryKey: ["assignments", params],
    queryFn: () => guides.assignments({ ...params, limit: 50 }),
  });
}

export function useRespondToAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      status,
      guideNote,
    }: {
      bookingId: number;
      status: "CONFIRMED" | "DECLINED" | "COMPLETED";
      guideNote?: string | null;
    }) => guides.respond(bookingId, { status, guideNote }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assignments"] }),
  });
}

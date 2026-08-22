import { Badge } from "@/components/ui/Badge";
import type { BookingStatus } from "@/lib/types";

const tones: Record<BookingStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  PENDING: "warning",
  CONFIRMED: "success",
  DECLINED: "danger",
  CANCELLED: "neutral",
  COMPLETED: "info",
};

const labels: Record<BookingStatus, string> = {
  PENDING: "Awaiting guide",
  CONFIRMED: "Confirmed",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <Badge tone={tones[status]}>{labels[status]}</Badge>;
}

export const bookingStatusLabel = (status: BookingStatus): string => labels[status];

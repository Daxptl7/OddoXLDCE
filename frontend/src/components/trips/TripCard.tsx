import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateRange } from "@/lib/format";
import type { SerializedTrip } from "@/lib/types";

export function TripCard({ trip }: { trip: SerializedTrip }) {
  const isPast = trip.endDate ? trip.endDate < new Date().toISOString().slice(0, 10) : false;

  return (
    <Link href={`/trips/${trip.id}`}>
      <Card className="flex h-full flex-col gap-2 p-4 transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-foreground">{trip.name}</p>
          {trip.isPublic ? <Badge tone="info">Shared</Badge> : null}
        </div>
        <p className="text-sm text-muted">{formatDateRange(trip.startDate, trip.endDate)}</p>
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted">
          <span>
            {trip.stopCount ?? 0} {trip.stopCount === 1 ? "stop" : "stops"}
          </span>
          {isPast ? <Badge>Past</Badge> : null}
        </div>
      </Card>
    </Link>
  );
}

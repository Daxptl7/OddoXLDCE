import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateRange } from "@/lib/format";
import type { SerializedTrip } from "@/lib/types";
import { CalendarIcon, CompassIcon, ShareIcon } from "@/components/ui/Icons";

export function TripCard({ trip }: { trip: SerializedTrip }) {
  const isPast = trip.endDate ? trip.endDate < new Date().toISOString().slice(0, 10) : false;
  const cover = trip.coverPhotoUrl ?? trip.stops?.find((stop) => stop.city?.imageUrl)?.city?.imageUrl ?? null;

  return (
    <Link href={`/trips/${trip.id}`} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
        <div
          className="relative aspect-[4/3] bg-[#dddddd]"
          style={cover ? { backgroundImage: `url(${cover})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        >
          {!cover ? (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-rose-50 via-white to-teal-50 text-primary">
              <CompassIcon className="h-10 w-10" />
            </div>
          ) : null}
          <div className="absolute left-3 top-3 flex gap-2">
            {trip.isPublic ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-primary shadow-sm">
                <ShareIcon className="h-3.5 w-3.5" />
                Shared
              </span>
            ) : null}
            {isPast ? <Badge>Past</Badge> : null}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <p className="line-clamp-1 font-bold text-foreground">{trip.name}</p>
            {trip.description ? <p className="mt-1 line-clamp-2 text-sm text-muted">{trip.description}</p> : null}
          </div>
          <div className="mt-auto flex items-center justify-between gap-3 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4" />
              {formatDateRange(trip.startDate, trip.endDate)}
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
              <CompassIcon className="h-4 w-4 text-primary" />
              {trip.stopCount ?? trip.stops?.length ?? 0}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

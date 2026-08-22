import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateRange, formatMoney } from "@/lib/format";
import type { Itinerary } from "@/lib/types";
import { CalendarIcon, ClockIcon, CompassIcon, MapPinIcon, WalletIcon } from "@/components/ui/Icons";

export function TimelineView({ itinerary }: { itinerary: Itinerary }) {
  if (itinerary.stops.length === 0) {
    return <EmptyState title="No timeline yet" description="Add stops to see the trip sequence." />;
  }

  return (
    <div className="relative flex flex-col gap-4">
      <div className="absolute bottom-4 left-5 top-4 hidden w-px bg-border sm:block" />
      {itinerary.stops.map((stop, index) => (
        <article key={stop.id} className="relative grid gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm sm:grid-cols-[2.75rem_1fr]">
          <div className="hidden sm:flex">
            <span className="z-10 flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-sm font-bold text-white">
              {index + 1}
            </span>
          </div>
          <div>
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-bold uppercase text-muted">
                  <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                  {formatDateRange(stop.arrivalDate, stop.departureDate)}
                </p>
                <h3 className="mt-1 inline-flex items-center gap-2 text-xl font-bold text-foreground">
                  <MapPinIcon className="h-5 w-5 text-primary" />
                  {stop.city?.name}, <span className="text-muted">{stop.city?.country}</span>
                </h3>
              </div>
              <Badge>{formatMoney(stop.stopTotal)}</Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <TimelineMetric label="Nights" value={String(stop.nights)} />
              <TimelineMetric label="Transport" value={formatMoney(stop.transportCost)} />
              <TimelineMetric label="Stay" value={formatMoney(stop.accommodationCost)} />
              <TimelineMetric label="Activities" value={String(stop.activities.length)} />
            </div>

            {stop.notes ? <p className="mt-3 text-sm text-muted">{stop.notes}</p> : null}

            <div className="mt-4 flex flex-col gap-2">
              {stop.activities.length ? (
                stop.activities.map((link) => (
                  <div key={link.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#f7f7f7] px-3 py-2 text-sm">
                    <span className="inline-flex min-w-0 items-center gap-2 text-foreground">
                      {link.scheduledTime ? <ClockIcon className="h-4 w-4 shrink-0 text-primary" /> : <CompassIcon className="h-4 w-4 shrink-0 text-primary" />}
                      <span className="truncate">{link.activity?.name ?? "Activity"}</span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-muted">
                      <WalletIcon className="h-3.5 w-3.5" />
                      {formatMoney(link.cost)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-border bg-[#f7f7f7] px-3 py-2 text-sm text-muted">
                  No activities on this stop yet.
                </p>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function TimelineMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#f7f7f7] px-3 py-2">
      <p className="text-xs font-semibold uppercase text-muted">{label}</p>
      <p className="mt-0.5 font-bold text-foreground">{value}</p>
    </div>
  );
}

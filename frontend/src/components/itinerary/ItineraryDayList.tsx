import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatMoney } from "@/lib/format";
import type { Itinerary } from "@/lib/types";
import { CalendarIcon, ClockIcon, WalletIcon } from "@/components/ui/Icons";

export function ItineraryDayList({ itinerary }: { itinerary: Itinerary }) {
  if (itinerary.days.length === 0) {
    return <EmptyState title="No days yet" description="Add stops to build a day-by-day plan." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {itinerary.days.map((day) => (
        <Card key={day.date} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-primary">
                <CalendarIcon className="h-5 w-5" />
              </span>
              <div>
              <p className="text-xs font-bold uppercase text-muted">Day {day.dayNumber}</p>
              <p className="font-bold text-foreground">
                {formatDate(day.date)}
                {day.city ? ` · ${day.city}, ${day.country}` : ""}
              </p>
              </div>
            </div>
            {day.dayCost > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#f7f7f7] px-3 py-1 text-sm font-bold text-foreground">
                <WalletIcon className="h-4 w-4 text-primary" />
                {formatMoney(day.dayCost)}
              </span>
            ) : null}
          </div>

          {day.isEmpty ? (
            <p className="mt-3 rounded-2xl border border-dashed border-border bg-[#f7f7f7] px-4 py-3 text-sm text-muted">
              {day.city ? "No activities planned yet." : "No stop scheduled."}
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {day.activities.map((activity) => (
                <li key={activity.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border px-3 py-2 text-sm">
                  <span className="min-w-0 text-foreground">
                    {activity.scheduledTime ? (
                      <span className="mr-2 inline-flex items-center gap-1 text-muted">
                        <ClockIcon className="h-3.5 w-3.5" />
                        {activity.scheduledTime}
                      </span>
                    ) : null}
                    {activity.activity?.name ?? "Activity"}
                    {activity.unscheduled ? (
                      <span className="ml-2">
                        <Badge tone="warning">Unscheduled</Badge>
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-muted">{formatMoney(activity.cost)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
  );
}

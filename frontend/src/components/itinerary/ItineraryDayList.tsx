import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatMoney } from "@/lib/format";
import type { Itinerary } from "@/lib/types";

export function ItineraryDayList({ itinerary }: { itinerary: Itinerary }) {
  if (itinerary.days.length === 0) {
    return <EmptyState title="No days yet" description="Add stops to build a day-by-day plan." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {itinerary.days.map((day) => (
        <Card key={day.date} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Day {day.dayNumber}</p>
              <p className="font-medium text-foreground">
                {formatDate(day.date)}
                {day.city ? ` · ${day.city}, ${day.country}` : ""}
              </p>
            </div>
            {day.dayCost > 0 ? <span className="text-sm font-medium text-foreground">{formatMoney(day.dayCost)}</span> : null}
          </div>

          {day.isEmpty ? (
            <p className="mt-2 text-sm text-muted">{day.city ? "No activities planned yet." : "No stop scheduled."}</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-1.5">
              {day.activities.map((activity) => (
                <li key={activity.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">
                    {activity.scheduledTime ? <span className="mr-2 text-muted">{activity.scheduledTime}</span> : null}
                    {activity.activity?.name ?? "Activity"}
                    {activity.unscheduled ? (
                      <span className="ml-2">
                        <Badge tone="warning">Unscheduled</Badge>
                      </span>
                    ) : null}
                  </span>
                  <span className="text-muted">{formatMoney(activity.cost)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
  );
}

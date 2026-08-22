import clsx from "clsx";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateShort, formatMoney } from "@/lib/format";
import type { Itinerary } from "@/lib/types";

const cityPalette = [
  "border-blue-200 bg-blue-50",
  "border-green-200 bg-green-50",
  "border-amber-200 bg-amber-50",
  "border-purple-200 bg-purple-50",
  "border-pink-200 bg-pink-50",
];

export function CalendarGrid({ itinerary }: { itinerary: Itinerary }) {
  if (itinerary.days.length === 0) {
    return <EmptyState title="No days yet" description="Add stops to see them laid out on a calendar." />;
  }

  const cityColors = new Map<string, string>();
  let colorIndex = 0;
  for (const day of itinerary.days) {
    if (day.city && !cityColors.has(day.city)) {
      cityColors.set(day.city, cityPalette[colorIndex % cityPalette.length]);
      colorIndex += 1;
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {itinerary.days.map((day) => (
        <div
          key={day.date}
          className={clsx(
            "flex flex-col gap-1 rounded-lg border p-3",
            day.city ? cityColors.get(day.city) : "border-border bg-slate-50",
          )}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{formatDateShort(day.date)}</p>
          <p className="text-sm font-medium text-foreground">{day.city ?? "No stop"}</p>
          <p className="text-xs text-muted">
            {day.activities.length} {day.activities.length === 1 ? "activity" : "activities"}
          </p>
          {day.dayCost > 0 ? <p className="text-xs font-medium text-foreground">{formatMoney(day.dayCost)}</p> : null}
        </div>
      ))}
    </div>
  );
}

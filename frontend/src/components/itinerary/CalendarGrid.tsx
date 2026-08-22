import clsx from "clsx";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateShort, formatMoney } from "@/lib/format";
import type { Itinerary } from "@/lib/types";
import { CalendarIcon, MapPinIcon, WalletIcon } from "@/components/ui/Icons";

const cityPalette = [
  "border-rose-200 bg-rose-50",
  "border-teal-200 bg-teal-50",
  "border-amber-200 bg-amber-50",
  "border-sky-200 bg-sky-50",
  "border-lime-200 bg-lime-50",
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {itinerary.days.map((day) => (
        <div
          key={day.date}
          className={clsx(
            "flex min-h-32 flex-col gap-2 rounded-2xl border p-3 shadow-sm",
            day.city ? cityColors.get(day.city) : "border-border bg-white",
          )}
        >
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-muted">
            <CalendarIcon className="h-3.5 w-3.5" />
            {formatDateShort(day.date)}
          </p>
          <p className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground">
            <MapPinIcon className="h-4 w-4 text-primary" />
            {day.city ?? "No stop"}
          </p>
          <p className="text-xs text-muted">
            {day.activities.length} {day.activities.length === 1 ? "activity" : "activities"}
          </p>
          {day.dayCost > 0 ? (
            <p className="mt-auto inline-flex items-center gap-1 text-xs font-bold text-foreground">
              <WalletIcon className="h-3.5 w-3.5 text-primary" />
              {formatMoney(day.dayCost)}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

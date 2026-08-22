import clsx from "clsx";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatMoney } from "@/lib/format";
import type { Itinerary, ItineraryDay } from "@/lib/types";
import { CalendarIcon, MapPinIcon, WalletIcon } from "@/components/ui/Icons";

const cityPalette = [
  "border-rose-200 bg-rose-50",
  "border-teal-200 bg-teal-50",
  "border-amber-200 bg-amber-50",
  "border-sky-200 bg-sky-50",
  "border-lime-200 bg-lime-50",
];

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function buildMonths(start: string, end: string) {
  const first = parseDate(start);
  const last = parseDate(end);
  const cursor = new Date(first.getFullYear(), first.getMonth(), 1);
  const months: Date[] = [];

  while (cursor <= last) {
    months.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}

function buildMonthCells(month: Date) {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const cells: Array<{ date: Date; inMonth: boolean }> = [];

  for (let index = firstOfMonth.getDay(); index > 0; index -= 1) {
    cells.push({ date: new Date(month.getFullYear(), month.getMonth(), 1 - index), inMonth: false });
  }

  for (let day = 1; day <= lastOfMonth.getDate(); day += 1) {
    cells.push({ date: new Date(month.getFullYear(), month.getMonth(), day), inMonth: true });
  }

  while (cells.length % 7 !== 0) {
    const next = new Date(cells[cells.length - 1].date);
    next.setDate(next.getDate() + 1);
    cells.push({ date: next, inMonth: false });
  }

  return cells;
}

export function CalendarGrid({ itinerary }: { itinerary: Itinerary }) {
  if (itinerary.days.length === 0) {
    return <EmptyState title="No days yet" description="Add stops to see them laid out on a calendar." />;
  }

  const daysByDate = new Map(itinerary.days.map((day) => [day.date, day]));
  const cityColors = new Map<string, string>();
  let colorIndex = 0;
  for (const day of itinerary.days) {
    if (day.city && !cityColors.has(day.city)) {
      cityColors.set(day.city, cityPalette[colorIndex % cityPalette.length]);
      colorIndex += 1;
    }
  }

  const months = buildMonths(itinerary.startDate, itinerary.endDate);

  return (
    <div className="flex flex-col gap-6">
      {months.map((month) => (
        <section key={dateKey(month)} className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">{monthLabel(month)}</h2>
          </div>

          <div className="grid grid-cols-7 border-b border-border bg-[#f7f7f7]">
            {weekDays.map((day) => (
              <div key={day} className="px-2 py-2 text-center text-xs font-bold uppercase text-muted">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {buildMonthCells(month).map(({ date, inMonth }) => {
              const key = dateKey(date);
              const day = daysByDate.get(key);

              return (
                <CalendarCell
                  key={key}
                  date={date}
                  day={day}
                  inMonth={inMonth}
                  color={day?.city ? cityColors.get(day.city) : undefined}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function CalendarCell({
  date,
  day,
  inMonth,
  color,
}: {
  date: Date;
  day?: ItineraryDay;
  inMonth: boolean;
  color?: string;
}) {
  const isTripDay = Boolean(day);

  return (
    <div
      className={clsx(
        "min-h-[116px] border-b border-r border-border p-2 last:border-r-0 sm:min-h-[136px]",
        !inMonth && "bg-[#fafafa] text-muted/60",
        inMonth && !isTripDay && "bg-white",
        isTripDay && (color ?? "bg-white"),
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span
          className={clsx(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
            isTripDay ? "bg-primary text-white" : "text-muted",
          )}
        >
          {date.getDate()}
        </span>
        {day?.dayCost ? (
          <span className="hidden items-center gap-1 text-[11px] font-bold text-foreground sm:inline-flex">
            <WalletIcon className="h-3 w-3 text-primary" />
            {formatMoney(day.dayCost)}
          </span>
        ) : null}
      </div>

      {day ? (
        <div className="mt-2 flex flex-col gap-1">
          <p className="inline-flex min-w-0 items-center gap-1 text-xs font-bold text-foreground">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate">{day.city ?? "No stop"}</span>
          </p>
          <p className="text-[11px] font-semibold text-muted">
            Day {day.dayNumber} · {day.activities.length} {day.activities.length === 1 ? "activity" : "activities"}
          </p>
          <div className="mt-1 hidden flex-col gap-1 sm:flex">
            {day.activities.slice(0, 2).map((activity) => (
              <p key={activity.id} className="truncate rounded-md bg-white/70 px-2 py-1 text-[11px] font-medium text-foreground">
                {activity.scheduledTime ? `${activity.scheduledTime} ` : ""}
                {activity.activity?.name ?? "Activity"}
              </p>
            ))}
            {day.activities.length > 2 ? (
              <p className="text-[11px] font-bold text-muted">+{day.activities.length - 2} more</p>
            ) : null}
          </div>
        </div>
      ) : inMonth ? (
        <p className="mt-2 text-[11px] text-muted">Outside trip</p>
      ) : null}
    </div>
  );
}

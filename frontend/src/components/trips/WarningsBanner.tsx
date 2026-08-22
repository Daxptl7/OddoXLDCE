import type { TripWarning } from "@/lib/types";

const toneByType: Record<TripWarning["type"], string> = {
  overlapping_stops: "border-amber-200 bg-amber-50 text-amber-800",
  outside_trip_dates: "border-amber-200 bg-amber-50 text-amber-800",
  empty_stop: "border-slate-200 bg-slate-50 text-slate-700",
};

export function WarningsBanner({ warnings }: { warnings: TripWarning[] }) {
  if (warnings.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {warnings.map((warning, index) => (
        <div
          key={`${warning.type}-${warning.stopId}-${index}`}
          className={`rounded-lg border px-3 py-2 text-sm ${toneByType[warning.type]}`}
        >
          {warning.message}
        </div>
      ))}
    </div>
  );
}

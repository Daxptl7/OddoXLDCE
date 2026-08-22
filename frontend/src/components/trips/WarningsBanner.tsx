import type { TripWarning } from "@/lib/types";

const toneByType: Record<TripWarning["type"], string> = {
  overlapping_stops: "border-amber-200 bg-amber-50 text-amber-800",
  outside_trip_dates: "border-amber-200 bg-amber-50 text-amber-800",
  empty_stop: "border-slate-200 bg-slate-50 text-slate-700",
  bad_weather: "border-rose-300 bg-gradient-to-r from-rose-50 to-amber-50 text-rose-950 font-medium",
};

const iconByType: Record<TripWarning["type"], string> = {
  overlapping_stops: "⚠️",
  outside_trip_dates: "📅",
  empty_stop: "📌",
  bad_weather: "⛈️",
};

export function WarningsBanner({ warnings }: { warnings: TripWarning[] }) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {warnings.map((warning, index) => (
        <div
          key={`${warning.type}-${warning.stopId}-${index}`}
          className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs sm:text-sm shadow-sm ${
            toneByType[warning.type] || "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          <span className="text-base">{iconByType[warning.type] || "⚠️"}</span>
          <span>{warning.message}</span>
        </div>
      ))}
    </div>
  );
}

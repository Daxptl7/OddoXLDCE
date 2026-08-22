"use client";

import { useState } from "react";
import { useCityWeather } from "@/hooks/useWeather";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CloudRainIcon, SunIcon } from "@/components/ui/Icons";
import { formatDate } from "@/lib/format";

interface WeatherWidgetProps {
  cityId: number;
  cityName: string;
  startDate?: string | null;
  endDate?: string | null;
}

export function WeatherWidget({ cityId, cityName, startDate, endDate }: WeatherWidgetProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { data, isLoading } = useCityWeather(cityId, startDate, endDate);

  const forecast = data?.forecast;
  if (isLoading || !forecast || forecast.days.length === 0) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
        <SunIcon className="h-3.5 w-3.5 animate-pulse" />
        <span>Weather...</span>
      </div>
    );
  }

  const hasAdverse = forecast.hasAdverseWeather;
  const firstDay = forecast.days[0];
  const minTemp = Math.min(...forecast.days.map((d) => d.tempMin));
  const maxTemp = Math.max(...forecast.days.map((d) => d.tempMax));

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={`group inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
          hasAdverse
            ? "border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
            : "border border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100"
        }`}
        title="Click to view full weather forecast"
      >
        <span className="text-sm">{firstDay?.icon || "⛅"}</span>
        <span>
          {minTemp}° - {maxTemp}°C
        </span>
        {hasAdverse ? (
          <span className="flex items-center gap-0.5 rounded-md bg-amber-200/80 px-1.5 py-0.2 text-[10px] font-bold text-amber-900">
            ⚠️ Weather Alert
          </span>
        ) : (
          <span className="text-[11px] text-sky-700">{firstDay?.condition}</span>
        )}
      </button>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Weather Forecast: ${cityName}`}
        maxWidth="max-w-2xl"
      >
        <div className="flex flex-col gap-4">
          {hasAdverse && forecast.adverseSummary ? (
            <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-4 text-amber-950">
              <div className="flex items-start gap-2.5">
                <span className="text-xl">⚠️</span>
                <div>
                  <h4 className="font-bold text-amber-900">Adverse Weather Warning</h4>
                  <p className="mt-0.5 text-xs leading-relaxed text-amber-800">{forecast.adverseSummary}</p>
                  <p className="mt-2 text-xs font-medium text-amber-900/80">
                    💡 Tip: Schedule outdoor sightseeing on clear days and plan museums or food tours during rain.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-3.5 text-teal-900">
              <div className="flex items-center gap-2">
                <span className="text-lg">☀️</span>
                <p className="text-xs font-semibold">Great travel conditions expected for this destination!</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Daily Breakdown</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {forecast.days.map((day) => (
                <div
                  key={day.date}
                  className={`flex flex-col justify-between rounded-2xl border p-3 transition-colors ${
                    day.isAdverse ? "border-amber-200 bg-amber-50/50" : "border-border bg-[#fbfbfb]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-foreground">{formatDate(day.date)}</p>
                      <p className="mt-0.5 text-xs text-muted">{day.condition}</p>
                    </div>
                    <span className="text-2xl">{day.icon}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2 text-xs">
                    <div className="font-bold text-foreground">
                      <span className="text-primary">{day.tempMax}°C</span>{" "}
                      <span className="font-normal text-muted">/ {day.tempMin}°C</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted">
                      {day.precipitationProb > 0 ? (
                        <span className="flex items-center gap-1 font-medium text-sky-600">
                          <CloudRainIcon className="h-3.5 w-3.5" />
                          {day.precipitationProb}%
                        </span>
                      ) : null}
                      <span className="text-[11px]">💨 {day.windSpeedKm}km/h</span>
                    </div>
                  </div>

                  {day.adverseReason ? (
                    <div className="mt-2 rounded-lg bg-amber-100/70 px-2 py-1 text-[11px] font-semibold text-amber-900">
                      ⚠️ {day.adverseReason}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

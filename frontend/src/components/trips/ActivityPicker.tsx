"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ErrorBanner, errorMessage } from "@/components/ui/ErrorBanner";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useCityActivities } from "@/hooks/useCatalogue";
import { useAddStopActivity } from "@/hooks/useStops";
import { formatCategory, formatMoney } from "@/lib/format";
import type { SerializedActivity, SerializedStop } from "@/lib/types";
import { ClockIcon, PlusIcon, SearchIcon, SparklesIcon, WalletIcon } from "@/components/ui/Icons";

export function ActivityPicker({
  tripId,
  stop,
  open,
  onClose,
}: {
  tripId: number;
  stop: SerializedStop | null;
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebouncedValue(query, 250);
  const { data, isLoading } = useCityActivities(stop?.cityId ?? null, debouncedQuery);
  const addStopActivity = useAddStopActivity(tripId);

  async function handleAdd(activity: SerializedActivity) {
    if (!stop) return;
    setError(null);
    try {
      await addStopActivity.mutateAsync({
        stopId: stop.id,
        data: { activityId: activity.id, scheduledDate: stop.arrivalDate },
      });
    } catch (err) {
      setError(errorMessage(err, "Could not add that activity"));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={stop?.city ? `Add an activity in ${stop.city.name}` : "Add an activity"}>
      <div className="flex flex-col gap-4">
        {error ? <ErrorBanner message={error} /> : null}
        <div className="flex items-center gap-3 rounded-full border border-border bg-white px-4 py-2.5 shadow-sm focus-within:border-foreground [&>div]:flex-1">
          <SearchIcon className="h-5 w-5 text-primary" />
          <Input
            aria-label="Search activities"
            placeholder="Search activities"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="border-0 p-0 focus:border-0 focus:ring-0"
          />
        </div>
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <p className="py-6 text-center text-sm text-muted">Loading…</p>
          ) : data && data.activities.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {data.activities.map((activity) => (
                <li
                  key={activity.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{activity.name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <Badge>{formatCategory(activity.category)}</Badge>
                      <span className="inline-flex items-center gap-1">
                        <WalletIcon className="h-3.5 w-3.5 text-primary" />
                        {formatMoney(activity.estimatedCost)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ClockIcon className="h-3.5 w-3.5 text-primary" />
                        {activity.durationMinutes} min
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => handleAdd(activity)} disabled={addStopActivity.isPending}>
                    <PlusIcon className="h-4 w-4" />
                    Add
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted">
              <SparklesIcon className="h-6 w-6 text-primary" />
              No activities found for this city.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

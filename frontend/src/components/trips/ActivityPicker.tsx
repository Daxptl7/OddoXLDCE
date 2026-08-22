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
        <Input placeholder="Search activities…" value={query} onChange={(event) => setQuery(event.target.value)} />
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <p className="py-6 text-center text-sm text-muted">Loading…</p>
          ) : data && data.activities.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {data.activities.map((activity) => (
                <li
                  key={activity.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{activity.name}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                      <Badge>{formatCategory(activity.category)}</Badge>
                      <span>{formatMoney(activity.estimatedCost)}</span>
                      <span>{activity.durationMinutes} min</span>
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => handleAdd(activity)} disabled={addStopActivity.isPending}>
                    Add
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted">No activities found for this city.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

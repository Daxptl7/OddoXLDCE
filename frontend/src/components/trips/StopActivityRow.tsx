"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRemoveStopActivity, useUpdateStopActivity } from "@/hooks/useStops";
import { formatCategory, formatMoney } from "@/lib/format";
import type { SerializedStopActivity } from "@/lib/types";

export function StopActivityRow({ tripId, link }: { tripId: number; link: SerializedStopActivity }) {
  const [editing, setEditing] = useState(false);
  const [customCost, setCustomCost] = useState(link.customCost !== null ? String(link.customCost) : "");
  const updateStopActivity = useUpdateStopActivity(tripId);
  const removeStopActivity = useRemoveStopActivity(tripId);

  async function saveCustomCost() {
    await updateStopActivity.mutateAsync({
      id: link.id,
      data: { customCost: customCost === "" ? null : Number(customCost) },
    });
    setEditing(false);
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white px-3 py-2">
      <div>
        <p className="text-sm font-medium text-foreground">{link.activity?.name ?? "Activity"}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
          {link.activity ? <Badge>{formatCategory(link.activity.category)}</Badge> : null}
          {link.scheduledTime ? <span>{link.scheduledTime}</span> : null}
          {link.unscheduled ? <Badge tone="warning">Unscheduled</Badge> : null}
          {link.customCost !== null ? (
            <span className="italic">custom {formatMoney(link.customCost)}</span>
          ) : (
            <span>{formatMoney(link.cost)}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {editing ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={0}
              step="0.01"
              value={customCost}
              onChange={(event) => setCustomCost(event.target.value)}
              className="w-24"
            />
            <Button size="sm" onClick={saveCustomCost} disabled={updateStopActivity.isPending}>
              Save
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            Override cost
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => removeStopActivity.mutate(link.id)}
          disabled={removeStopActivity.isPending}
        >
          Remove
        </Button>
      </div>
    </li>
  );
}

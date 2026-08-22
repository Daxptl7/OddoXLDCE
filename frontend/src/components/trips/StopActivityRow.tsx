"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRemoveStopActivity, useUpdateStopActivity } from "@/hooks/useStops";
import { formatCategory, formatMoney } from "@/lib/format";
import type { SerializedStopActivity } from "@/lib/types";
import { EditIcon, TrashIcon, WalletIcon } from "@/components/ui/Icons";

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
    <li className="flex flex-col justify-between gap-3 rounded-2xl border border-border bg-white px-3 py-2 sm:flex-row sm:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-foreground">{link.activity?.name ?? "Activity"}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
          {link.activity ? <Badge>{formatCategory(link.activity.category)}</Badge> : null}
          {link.scheduledTime ? <span>{link.scheduledTime}</span> : null}
          {link.unscheduled ? <Badge tone="warning">Unscheduled</Badge> : null}
          {link.customCost !== null ? (
            <span className="inline-flex items-center gap-1 italic">
              <WalletIcon className="h-3.5 w-3.5 text-primary" />
              custom {formatMoney(link.customCost)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <WalletIcon className="h-3.5 w-3.5 text-primary" />
              {formatMoney(link.cost)}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
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
            <EditIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Cost</span>
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => removeStopActivity.mutate(link.id)}
          disabled={removeStopActivity.isPending}
        >
          <TrashIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Remove</span>
        </Button>
      </div>
    </li>
  );
}

"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StopActivityRow } from "./StopActivityRow";
import { StopFormModal } from "./StopFormModal";
import { ActivityPicker } from "./ActivityPicker";
import { useDeleteStop, useReorderStops } from "@/hooks/useStops";
import { formatDateRange, formatMoney } from "@/lib/format";
import type { SerializedStop } from "@/lib/types";

export function StopList({ tripId, stops }: { tripId: number; stops: SerializedStop[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editingStop, setEditingStop] = useState<SerializedStop | null>(null);
  const [activityStop, setActivityStop] = useState<SerializedStop | null>(null);
  const reorderStops = useReorderStops(tripId);
  const deleteStop = useDeleteStop(tripId);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = stops.findIndex((stop) => stop.id === active.id);
    const newIndex = stops.findIndex((stop) => stop.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(stops, oldIndex, newIndex);
    reorderStops.mutate(reordered.map((stop) => stop.id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Stops</h2>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          Add stop
        </Button>
      </div>

      {stops.length === 0 ? (
        <EmptyState
          title="No stops yet"
          description="Add a city to start building your itinerary."
          action={
            <Button size="sm" onClick={() => setAddOpen(true)}>
              Add stop
            </Button>
          }
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={stops.map((stop) => stop.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-4">
              {stops.map((stop) => (
                <SortableStopCard
                  key={stop.id}
                  tripId={tripId}
                  stop={stop}
                  onEdit={() => setEditingStop(stop)}
                  onDelete={() => deleteStop.mutate(stop.id)}
                  onAddActivity={() => setActivityStop(stop)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <StopFormModal tripId={tripId} open={addOpen} onClose={() => setAddOpen(false)} />
      {editingStop ? (
        <StopFormModal tripId={tripId} open stop={editingStop} onClose={() => setEditingStop(null)} />
      ) : null}
      <ActivityPicker tripId={tripId} stop={activityStop} open={activityStop !== null} onClose={() => setActivityStop(null)} />
    </div>
  );
}

function SortableStopCard({
  tripId,
  stop,
  onEdit,
  onDelete,
  onAddActivity,
}: {
  tripId: number;
  stop: SerializedStop;
  onEdit: () => void;
  onDelete: () => void;
  onAddActivity: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
            className="mt-1 cursor-grab touch-none rounded p-1 text-muted hover:bg-slate-100 active:cursor-grabbing"
          >
            ⠿
          </button>
          <div>
            <p className="font-medium text-foreground">
              {stop.city?.name}, <span className="text-muted">{stop.city?.country}</span>
            </p>
            <p className="text-sm text-muted">
              {formatDateRange(stop.arrivalDate, stop.departureDate)} · {stop.nights} {stop.nights === 1 ? "night" : "nights"}
            </p>
            {stop.notes ? <p className="mt-1 text-sm text-muted">{stop.notes}</p> : null}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={onEdit}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-muted">
        <span>Transport {formatMoney(stop.transportCost)}</span>
        <span>Stay {formatMoney(stop.accommodationCost)}</span>
        <span>Activities {formatMoney(stop.activityCost)}</span>
        <span className="font-medium text-foreground">Total {formatMoney(stop.stopTotal)}</span>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {stop.activities.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {stop.activities.map((link) => (
              <StopActivityRow key={link.id} tripId={tripId} link={link} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No activities planned yet.</p>
        )}
        <Button size="sm" variant="secondary" className="self-start" onClick={onAddActivity}>
          Add activity
        </Button>
      </div>
    </Card>
  );
}

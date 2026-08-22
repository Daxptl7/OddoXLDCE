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
import { WeatherWidget } from "@/components/weather/WeatherWidget";
import { HotelExplorerModal } from "@/components/hotels/HotelExplorerModal";
import { FoodSuggestionsModal } from "@/components/food/FoodSuggestionsModal";
import { useDeleteStop, useReorderStops } from "@/hooks/useStops";
import { formatDateRange, formatMoney } from "@/lib/format";
import type { SerializedStop } from "@/lib/types";
import {
  BedIcon,
  CompassIcon,
  EditIcon,
  GripIcon,
  MapPinIcon,
  PlusIcon,
  TrashIcon,
  UtensilsIcon,
  WalletIcon,
} from "@/components/ui/Icons";

export function StopList({ tripId, stops }: { tripId: number; stops: SerializedStop[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editingStop, setEditingStop] = useState<SerializedStop | null>(null);
  const [activityStop, setActivityStop] = useState<SerializedStop | null>(null);
  const [hotelStop, setHotelStop] = useState<SerializedStop | null>(null);
  const [foodStop, setFoodStop] = useState<SerializedStop | null>(null);

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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Stops</h2>
          <p className="text-sm text-muted">Drag cities into the order you want to travel.</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <PlusIcon className="h-4 w-4" />
          Add stop
        </Button>
      </div>

      {stops.length === 0 ? (
        <EmptyState
          title="No stops yet"
          description="Add a city to start building your itinerary."
          action={
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <PlusIcon className="h-4 w-4" />
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
                  onOpenHotels={() => setHotelStop(stop)}
                  onOpenFood={() => setFoodStop(stop)}
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

      {hotelStop && hotelStop.city ? (
        <HotelExplorerModal
          open={Boolean(hotelStop)}
          onClose={() => setHotelStop(null)}
          tripId={tripId}
          stopId={hotelStop.id}
          cityId={hotelStop.cityId}
          cityName={hotelStop.city.name}
          country={hotelStop.city.country}
          nights={hotelStop.nights}
          currentAccommodationCost={hotelStop.accommodationCost}
          currentNotes={hotelStop.notes}
        />
      ) : null}

      {foodStop && foodStop.city ? (
        <FoodSuggestionsModal
          open={Boolean(foodStop)}
          onClose={() => setFoodStop(null)}
          cityName={foodStop.city.name}
          country={foodStop.city.country}
          tripId={tripId}
          stopId={foodStop.id}
        />
      ) : null}
    </div>
  );
}

function SortableStopCard({
  tripId,
  stop,
  onEdit,
  onDelete,
  onAddActivity,
  onOpenHotels,
  onOpenFood,
}: {
  tripId: number;
  stop: SerializedStop;
  onEdit: () => void;
  onDelete: () => void;
  onAddActivity: () => void;
  onOpenHotels: () => void;
  onOpenFood: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="overflow-hidden p-0">
      <div className="grid md:grid-cols-[180px_1fr]">
        <div
          className="min-h-40 bg-[#dddddd]"
          style={
            stop.city?.imageUrl
              ? { backgroundImage: `url(${stop.city.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : undefined
          }
        >
          {!stop.city?.imageUrl ? (
            <div className="flex h-full min-h-40 items-center justify-center bg-gradient-to-br from-rose-50 via-white to-teal-50 text-primary">
              <MapPinIcon className="h-9 w-9" />
            </div>
          ) : null}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <button
                {...attributes}
                {...listeners}
                aria-label="Drag to reorder"
                className="mt-1 cursor-grab touch-none rounded-full p-2 text-muted hover:bg-[#f7f7f7] hover:text-foreground active:cursor-grabbing"
              >
                <GripIcon className="h-5 w-5" />
              </button>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-foreground text-base">
                    {stop.city?.name}, <span className="font-semibold text-muted">{stop.city?.country}</span>
                  </p>
                  {stop.city ? (
                    <WeatherWidget
                      cityId={stop.city.id}
                      cityName={stop.city.name}
                      startDate={stop.arrivalDate}
                      endDate={stop.departureDate}
                    />
                  ) : null}
                </div>

                <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted">
                  <CompassIcon className="h-4 w-4 text-primary" />
                  {formatDateRange(stop.arrivalDate, stop.departureDate)} · {stop.nights} {stop.nights === 1 ? "night" : "nights"}
                </p>
                {stop.notes ? <p className="mt-2 text-xs text-muted leading-relaxed">{stop.notes}</p> : null}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={onEdit} aria-label="Edit stop">
                <EditIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button size="sm" variant="ghost" onClick={onDelete} aria-label="Delete stop">
                <TrashIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted sm:grid-cols-4">
            <CostPill label="Transport" value={formatMoney(stop.transportCost)} />
            <CostPill label="Stay" value={formatMoney(stop.accommodationCost)} />
            <CostPill label="Activities" value={formatMoney(stop.activityCost)} />
            <CostPill label="Total" value={formatMoney(stop.stopTotal)} strong />
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {stop.activities.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {stop.activities.map((link) => (
                  <StopActivityRow key={link.id} tripId={tripId} link={link} />
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl border border-dashed border-border bg-[#f7f7f7] px-4 py-3 text-sm text-muted">
                No activities planned yet.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button size="sm" variant="secondary" onClick={onAddActivity}>
                <PlusIcon className="h-4 w-4" />
                Add activity
              </Button>

              <Button size="sm" variant="secondary" onClick={onOpenHotels} title="Search live hotels from OpenStreetMap">
                <BedIcon className="h-4 w-4 text-primary" />
                Find hotels
              </Button>

              <Button size="sm" variant="secondary" onClick={onOpenFood} title="Groq AI Best Local Foods & Eateries">
                <UtensilsIcon className="h-4 w-4 text-orange-500" />
                Food & Delicacies
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CostPill({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-2xl bg-[#f7f7f7] px-3 py-2">
      <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase text-muted">
        {strong ? <WalletIcon className="h-3.5 w-3.5 text-primary" /> : null}
        {label}
      </p>
      <p className={strong ? "font-bold text-foreground" : "font-semibold text-foreground"}>{value}</p>
    </div>
  );
}

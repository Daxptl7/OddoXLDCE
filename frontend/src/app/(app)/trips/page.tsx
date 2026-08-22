"use client";

import { useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useTrips } from "@/hooks/useTrips";
import { TripCard } from "@/components/trips/TripCard";
import { CreateTripModal } from "@/components/trips/CreateTripModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageSpinner } from "@/components/ui/Spinner";
import { ErrorBanner, errorMessage } from "@/components/ui/ErrorBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import clsx from "clsx";
import type { TripScope } from "@/lib/types";

const scopes: { value: TripScope; label: string }[] = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
];

export default function TripsPage() {
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<TripScope>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const q = useDebouncedValue(search, 300);

  const { data, isLoading, error } = useTrips({ q: q || undefined, scope });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-foreground">My Trips</h1>
        <Button onClick={() => setModalOpen(true)}>New trip</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search trips…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex gap-1">
          {scopes.map((option) => (
            <button
              key={option.value}
              onClick={() => setScope(option.value)}
              className={clsx(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                scope === option.value ? "bg-blue-50 text-primary" : "text-muted hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : error ? (
        <ErrorBanner message={errorMessage(error, "Could not load your trips")} />
      ) : data && data.trips.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No trips found"
          description="Try a different search, or create your first trip."
          action={<Button onClick={() => setModalOpen(true)}>New trip</Button>}
        />
      )}

      <CreateTripModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

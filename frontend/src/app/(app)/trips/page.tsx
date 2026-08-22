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
import { CalendarIcon, CompassIcon, PlusIcon, SearchIcon, SparklesIcon } from "@/components/ui/Icons";

const scopes: { value: TripScope; label: string; Icon: typeof CompassIcon }[] = [
  { value: "all", label: "All trips", Icon: CompassIcon },
  { value: "upcoming", label: "Upcoming", Icon: CalendarIcon },
  { value: "past", label: "Past", Icon: SparklesIcon },
];

export default function TripsPage() {
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<TripScope>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const q = useDebouncedValue(search, 300);

  const { data, isLoading, error } = useTrips({ q: q || undefined, scope });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5 rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-bold text-primary">Travel workspace</p>
            <h1 className="mt-1 text-3xl font-bold text-foreground">My Trips</h1>
            <p className="mt-1 text-sm text-muted">Search, filter, and jump back into your multi-city plans.</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            New trip
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex items-center gap-3 rounded-full border border-border bg-white px-4 py-2.5 shadow-sm focus-within:border-foreground [&>div]:flex-1">
            <SearchIcon className="h-5 w-5 text-primary" />
            <Input
              aria-label="Search trips"
              placeholder="Search destinations or trip names"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="border-0 p-0 shadow-none focus:border-0 focus:ring-0"
            />
          </div>
          <div className="scrollbar-hide flex gap-2 overflow-x-auto">
            {scopes.map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => setScope(value)}
                className={clsx(
                  "inline-flex min-w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors",
                  scope === value
                    ? "border-foreground bg-foreground text-white"
                    : "border-border bg-white text-muted hover:border-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : error ? (
        <ErrorBanner message={errorMessage(error, "Could not load your trips")} />
      ) : data && data.trips.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

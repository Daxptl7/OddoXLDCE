"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { useBookings } from "@/hooks/useBookings";
import { BookingCard } from "@/components/guides/BookingCard";
import { Button } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner, errorMessage } from "@/components/ui/ErrorBanner";
import { CalendarIcon, CompassIcon, SparklesIcon, UsersIcon } from "@/components/ui/Icons";
import { formatMoney } from "@/lib/format";

const scopes = [
  { value: "all", label: "All bookings", Icon: UsersIcon },
  { value: "upcoming", label: "Upcoming", Icon: CalendarIcon },
  { value: "past", label: "Past", Icon: SparklesIcon },
] as const;

export default function MyGuidesPage() {
  const [scope, setScope] = useState<(typeof scopes)[number]["value"]>("all");
  const { data, isLoading, error } = useBookings({ scope });

  const confirmed = data?.bookings.filter((booking) => booking.status === "CONFIRMED") ?? [];
  const spend = confirmed.reduce((sum, booking) => sum + booking.totalCost, 0);
  const days = confirmed.reduce((sum, booking) => sum + booking.days, 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5 rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-bold text-primary">Your people on the ground</p>
            <h1 className="mt-1 text-3xl font-bold text-foreground">My guides</h1>
            <p className="mt-1 text-sm text-muted">
              Every guide you have hired, the days they are yours, and how to reach them.
            </p>
          </div>
          <Link href="/guides">
            <Button>
              <CompassIcon className="h-4 w-4" />
              Find a guide
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Bookings" value={String(data?.total ?? 0)} />
          <Stat label="Confirmed" value={String(confirmed.length)} />
          <Stat label="Guided days" value={String(days)} />
          <Stat label="Committed" value={formatMoney(spend)} />
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

      {isLoading ? (
        <PageSpinner />
      ) : error ? (
        <ErrorBanner message={errorMessage(error, "Could not load your bookings")} />
      ) : data && data.bookings.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {data.bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="You have not hired a guide yet"
          description="Pick a city you are heading to and book someone who actually lives there."
          action={
            <Link href="/guides">
              <Button>Browse guides</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

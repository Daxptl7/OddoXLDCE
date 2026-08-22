"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { useMyAssignments } from "@/hooks/useGuides";
import { AssignmentCard } from "@/components/guides/AssignmentCard";
import { GuideAvatar } from "@/components/guides/GuideAvatar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner, errorMessage } from "@/components/ui/ErrorBanner";
import { BadgeCheckIcon, EditIcon, MapPinIcon, StarIcon } from "@/components/ui/Icons";
import { formatMoney } from "@/lib/format";
import type { BookingStatus } from "@/lib/types";

const filters = [
  { value: undefined, label: "Everyone" },
  { value: "PENDING", label: "Awaiting you" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DECLINED", label: "Declined" },
] as const;

export default function GuideWorkspacePage() {
  const [status, setStatus] = useState<BookingStatus | undefined>(undefined);
  const [scope, setScope] = useState<"all" | "upcoming" | "past">("all");
  const { data, isLoading, error } = useMyAssignments({ status, scope });

  if (isLoading) return <PageSpinner />;
  if (error) return <ErrorBanner message={errorMessage(error, "Could not load your assignments")} />;
  if (!data) return null;

  const { guide, stats, bookings } = data;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5 rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div className="flex items-start gap-4">
            <GuideAvatar name={guide.name} photoUrl={guide.photoUrl} className="h-16 w-16" />
            <div>
              <p className="text-sm font-bold text-primary">Guide workspace</p>
              <h1 className="mt-0.5 flex items-center gap-2 text-3xl font-bold text-foreground">
                {guide.name}
                {guide.isVerified ? <BadgeCheckIcon className="h-5 w-5 text-primary" /> : null}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted">
                <span className="flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4" />
                  {guide.city ? `${guide.city.name}, ${guide.city.country}` : "No city set"}
                </span>
                <span className="flex items-center gap-1">
                  <StarIcon className="h-4 w-4 text-primary" />
                  {guide.rating.toFixed(1)}
                </span>
                <span>{formatMoney(guide.dailyRate)} / day</span>
                {guide.isActive ? (
                  <Badge tone="success">Taking bookings</Badge>
                ) : (
                  <Badge tone="warning">Not listed</Badge>
                )}
              </p>
            </div>
          </div>
          <Link href="/guide/profile">
            <Button variant="secondary">
              <EditIcon className="h-4 w-4" />
              Edit profile
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Awaiting your reply" value={String(stats.pending)} highlight={stats.pending > 0} />
          <Stat label="Confirmed" value={String(stats.confirmed)} />
          <Stat label="Days booked" value={String(stats.daysBooked)} />
          <Stat label="Earnings" value={formatMoney(stats.earnings)} />
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="scrollbar-hide flex gap-2 overflow-x-auto">
            {filters.map(({ value, label }) => (
              <button
                key={label}
                onClick={() => setStatus(value)}
                className={clsx(
                  "min-w-fit rounded-full border px-4 py-2 text-sm font-bold transition-colors",
                  status === value
                    ? "border-foreground bg-foreground text-white"
                    : "border-border bg-white text-muted hover:border-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="scrollbar-hide flex gap-2 overflow-x-auto">
            {(["all", "upcoming", "past"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setScope(value)}
                className={clsx(
                  "min-w-fit rounded-full px-3 py-1.5 text-sm font-semibold capitalize transition-colors",
                  scope === value ? "bg-rose-50 text-primary" : "text-muted hover:text-foreground",
                )}
              >
                {value === "all" ? "All dates" : value}
              </button>
            ))}
          </div>
        </div>
      </div>

      {bookings.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {bookings.map((booking) => (
            <AssignmentCard key={booking.id} booking={booking} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No travellers here yet"
          description={
            guide.isActive
              ? "When someone books you for their days in " +
                (guide.city?.name ?? "your city") +
                ", they show up here."
              : "Your profile is hidden from the directory. Turn it back on from your profile page."
          }
          action={
            <Link href="/guide/profile">
              <Button variant="secondary">Open profile</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={clsx(
        "rounded-2xl border p-4",
        highlight ? "border-primary bg-rose-50" : "border-border bg-white",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

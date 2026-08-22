"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useTrip } from "@/hooks/useTrip";
import { useBudget } from "@/hooks/useBudget";
import { useItinerary } from "@/hooks/useItinerary";
import { useCopyTrip, useDeleteTrip, useShareTrip, useUnshareTrip } from "@/hooks/useTrip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { ErrorBanner, errorMessage } from "@/components/ui/ErrorBanner";
import { WarningsBanner } from "@/components/trips/WarningsBanner";
import { StopList } from "@/components/trips/StopList";
import { EditTripModal } from "@/components/trips/EditTripModal";
import { ItineraryDayList } from "@/components/itinerary/ItineraryDayList";
import { CalendarGrid } from "@/components/itinerary/CalendarGrid";
import { BudgetHealthBar } from "@/components/budget/BudgetHealthBar";
import { BudgetBreakdownChart } from "@/components/budget/BudgetBreakdownChart";
import { BudgetByStopChart } from "@/components/budget/BudgetByStopChart";
import { formatDateRange, formatMoney } from "@/lib/format";

type Tab = "builder" | "itinerary" | "calendar" | "budget";
const tabs: { value: Tab; label: string }[] = [
  { value: "builder", label: "Builder" },
  { value: "itinerary", label: "Itinerary" },
  { value: "calendar", label: "Calendar" },
  { value: "budget", label: "Budget" },
];

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const tripId = Number(id);
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("builder");
  const [editOpen, setEditOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data, isLoading, error } = useTrip(tripId);
  const { data: budgetData } = useBudget(tripId);
  const { data: itineraryData } = useItinerary(tripId);

  const shareTrip = useShareTrip(tripId);
  const unshareTrip = useUnshareTrip(tripId);
  const copyTrip = useCopyTrip();
  const deleteTrip = useDeleteTrip();

  if (isLoading) return <PageSpinner />;
  if (error) return <ErrorBanner message={errorMessage(error, "Could not load this trip")} />;
  if (!data) return null;

  const { trip, warnings, shareUrl } = data;

  async function handleShareToggle() {
    setActionError(null);
    try {
      if (trip.isPublic) {
        await unshareTrip.mutateAsync();
      } else {
        await shareTrip.mutateAsync();
      }
    } catch (err) {
      setActionError(errorMessage(err, "Could not update sharing"));
    }
  }

  async function handleCopy() {
    setActionError(null);
    try {
      const { trip: copy } = await copyTrip.mutateAsync(trip.id);
      router.push(`/trips/${copy.id}`);
    } catch (err) {
      setActionError(errorMessage(err, "Could not copy this trip"));
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${trip.name}"? This cannot be undone.`)) return;
    setActionError(null);
    try {
      await deleteTrip.mutateAsync(trip.id);
      router.push("/trips");
    } catch (err) {
      setActionError(errorMessage(err, "Could not delete this trip"));
    }
  }

  async function handleCopyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">{trip.name}</h1>
            {trip.isPublic ? <Badge tone="info">Shared</Badge> : null}
          </div>
          <p className="text-sm text-muted">{formatDateRange(trip.startDate, trip.endDate)}</p>
          {trip.description ? <p className="mt-2 max-w-2xl text-sm text-foreground">{trip.description}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          <Button size="sm" variant="secondary" onClick={handleCopy} disabled={copyTrip.isPending}>
            Copy trip
          </Button>
          <Button size="sm" variant="secondary" onClick={handleShareToggle} disabled={shareTrip.isPending || unshareTrip.isPending}>
            {trip.isPublic ? "Unshare" : "Share"}
          </Button>
          <Button size="sm" variant="danger" onClick={handleDelete} disabled={deleteTrip.isPending}>
            Delete
          </Button>
        </div>
      </div>

      {actionError ? <ErrorBanner message={actionError} /> : null}

      {trip.isPublic && shareUrl ? (
        <Card className="flex items-center justify-between gap-3 p-3">
          <p className="truncate text-sm text-muted">{shareUrl}</p>
          <Button size="sm" variant="secondary" onClick={handleCopyLink}>
            {copied ? "Copied!" : "Copy link"}
          </Button>
        </Card>
      ) : null}

      <WarningsBanner warnings={warnings} />

      <div className="flex gap-1 border-b border-border">
        {tabs.map((option) => (
          <button
            key={option.value}
            onClick={() => setTab(option.value)}
            className={clsx(
              "border-b-2 px-3 py-2 text-sm font-medium",
              tab === option.value ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {tab === "builder" ? <StopList tripId={trip.id} stops={trip.stops ?? []} /> : null}
      {tab === "itinerary" ? (
        itineraryData ? <ItineraryDayList itinerary={itineraryData.itinerary} /> : <PageSpinner />
      ) : null}
      {tab === "calendar" ? (
        itineraryData ? <CalendarGrid itinerary={itineraryData.itinerary} /> : <PageSpinner />
      ) : null}
      {tab === "budget" ? (
        budgetData ? (
          <div className="flex flex-col gap-6">
            <Card className="p-5">
              <BudgetHealthBar target={budgetData.budget.target} />
            </Card>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card className="p-5">
                <h3 className="mb-2 text-sm font-medium text-foreground">By category</h3>
                <BudgetBreakdownChart breakdown={budgetData.budget.breakdown} />
              </Card>
              <Card className="p-5">
                <h3 className="mb-2 text-sm font-medium text-foreground">By stop</h3>
                <BudgetByStopChart byStop={budgetData.budget.byStop} />
              </Card>
            </div>
            <Card className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
              <Stat label="Total" value={formatMoney(budgetData.budget.totals.grandTotal)} />
              <Stat label="Per day" value={formatMoney(budgetData.budget.perDay)} />
              <Stat label="Trip days" value={String(budgetData.budget.tripDays)} />
              <Stat label="Currency" value={budgetData.budget.currency} />
            </Card>
          </div>
        ) : (
          <PageSpinner />
        )
      ) : null}

      <EditTripModal trip={trip} open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

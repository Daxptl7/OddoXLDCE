"use client";

import { use, useState, type ReactNode } from "react";
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
import { TimelineView } from "@/components/itinerary/TimelineView";
import { BudgetHealthBar } from "@/components/budget/BudgetHealthBar";
import { BudgetBreakdownChart } from "@/components/budget/BudgetBreakdownChart";
import { BudgetByStopChart } from "@/components/budget/BudgetByStopChart";
import { AiCopilotPanel } from "@/components/trips/AiCopilotPanel";
import { formatDateRange, formatMoney } from "@/lib/format";
import {
  CalendarIcon,
  ChartIcon,
  CompassIcon,
  CopyIcon,
  EditIcon,
  HomeIcon,
  MapPinIcon,
  ShareIcon,
  SparklesIcon,
  TrashIcon,
  WalletIcon,
} from "@/components/ui/Icons";

type Tab = "builder" | "itinerary" | "timeline" | "calendar" | "budget" | "ai";
const tabs: { value: Tab; label: string; Icon: typeof CompassIcon }[] = [
  { value: "builder", label: "Builder", Icon: CompassIcon },
  { value: "itinerary", label: "Itinerary", Icon: HomeIcon },
  { value: "timeline", label: "Timeline", Icon: MapPinIcon },
  { value: "calendar", label: "Calendar", Icon: CalendarIcon },
  { value: "budget", label: "Budget", Icon: ChartIcon },
  { value: "ai", label: "AI", Icon: SparklesIcon },
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
  const cover = trip.coverPhotoUrl ?? trip.stops?.find((stop) => stop.city?.imageUrl)?.city?.imageUrl ?? null;
  const stopCount = trip.stops?.length ?? 0;
  const activityCount = trip.stops?.reduce((total, stop) => total + stop.activities.length, 0) ?? 0;

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
      <section className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
        <div
          className="relative min-h-[260px] bg-[#dddddd] sm:min-h-[340px]"
          style={cover ? { backgroundImage: `url(${cover})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        >
          {!cover ? (
            <div className="flex min-h-[260px] items-center justify-center bg-gradient-to-br from-rose-50 via-white to-teal-50 text-primary sm:min-h-[340px]">
              <MapPinIcon className="h-14 w-14" />
            </div>
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              {trip.isPublic ? <Badge tone="info">Shared</Badge> : null}
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">
                {formatDateRange(trip.startDate, trip.endDate)}
              </span>
            </div>
            <h1 className="mt-3 max-w-3xl text-3xl font-bold sm:text-5xl">{trip.name}</h1>
            {trip.description ? <p className="mt-3 max-w-2xl text-sm font-medium text-white/90">{trip.description}</p> : null}
          </div>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="grid grid-cols-3 gap-3">
            <TripStat icon={<CompassIcon className="h-4 w-4" />} label="Stops" value={String(stopCount)} />
            <TripStat icon={<CalendarIcon className="h-4 w-4" />} label="Range" value={formatDateRange(trip.startDate, trip.endDate)} />
            <TripStat icon={<WalletIcon className="h-4 w-4" />} label="Activities" value={String(activityCount)} />
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
            <EditIcon className="h-4 w-4" />
            Edit
          </Button>
          <Button size="sm" variant="secondary" onClick={handleCopy} disabled={copyTrip.isPending}>
            <CopyIcon className="h-4 w-4" />
            Copy trip
          </Button>
          <Button size="sm" variant="secondary" onClick={handleShareToggle} disabled={shareTrip.isPending || unshareTrip.isPending}>
            <ShareIcon className="h-4 w-4" />
            {trip.isPublic ? "Unshare" : "Share"}
          </Button>
          <Button size="sm" variant="danger" onClick={handleDelete} disabled={deleteTrip.isPending}>
            <TrashIcon className="h-4 w-4" />
            Delete
          </Button>
          </div>
        </div>
      </section>

      {actionError ? <ErrorBanner message={actionError} /> : null}

      {trip.isPublic && shareUrl ? (
        <Card className="flex items-center justify-between gap-3 p-3">
          <p className="truncate text-sm text-muted">{shareUrl}</p>
          <Button size="sm" variant="secondary" onClick={handleCopyLink}>
            <CopyIcon className="h-4 w-4" />
            {copied ? "Copied!" : "Copy link"}
          </Button>
        </Card>
      ) : null}

      <WarningsBanner warnings={warnings} />

      {budgetData ? (
        <Card className="p-4">
          <BudgetHealthBar target={budgetData.budget.target} />
        </Card>
      ) : null}

      <div className="scrollbar-hide flex gap-2 overflow-x-auto border-b border-border pb-3">
        {tabs.map(({ value, label, Icon }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={clsx(
              "inline-flex min-w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors",
              tab === value
                ? "border-foreground bg-foreground text-white"
                : "border-border bg-white text-muted hover:border-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "builder" ? <StopList tripId={trip.id} stops={trip.stops ?? []} /> : null}
      {tab === "itinerary" ? (
        itineraryData ? <ItineraryDayList itinerary={itineraryData.itinerary} /> : <PageSpinner />
      ) : null}
      {tab === "timeline" ? (
        itineraryData ? <TimelineView itinerary={itineraryData.itinerary} /> : <PageSpinner />
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
      {tab === "ai" ? <AiCopilotPanel trip={trip} budget={budgetData?.budget} /> : null}

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

function TripStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f7f7f7] px-3 py-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted">
        <span className="text-primary">{icon}</span>
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

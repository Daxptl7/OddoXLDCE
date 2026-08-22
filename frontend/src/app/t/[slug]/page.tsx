import { notFound } from "next/navigation";
import { publicTrips, ApiError } from "@/lib/api/endpoints";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BudgetHealthBar } from "@/components/budget/BudgetHealthBar";
import { BudgetBreakdownChart } from "@/components/budget/BudgetBreakdownChart";
import { ItineraryDayList } from "@/components/itinerary/ItineraryDayList";
import { CopySharedTripButton } from "@/components/trips/CopySharedTripButton";
import { formatDateRange, formatMoney } from "@/lib/format";
import type { PublicTripResponse } from "@/lib/types";
import { CompassIcon, MapPinIcon, WalletIcon } from "@/components/ui/Icons";

export default async function PublicTripPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let data: PublicTripResponse;
  try {
    data = await publicTrips.get(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const { trip, itinerary, budget } = data;
  const cover = trip.coverPhotoUrl ?? trip.stops?.find((stop) => stop.city?.imageUrl)?.city?.imageUrl ?? null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <section className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
        <div
          className="relative min-h-[260px] bg-[#dddddd]"
          style={cover ? { backgroundImage: `url(${cover})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        >
          {!cover ? (
            <div className="flex min-h-[260px] items-center justify-center bg-gradient-to-br from-rose-50 via-white to-teal-50 text-primary">
              <MapPinIcon className="h-14 w-14" />
            </div>
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
            <p className="text-xs font-bold uppercase">Shared trip</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-5xl">{trip.name}</h1>
            <p className="mt-2 text-sm font-semibold text-white/90">{formatDateRange(trip.startDate, trip.endDate)}</p>
            {trip.owner ? <p className="mt-1 text-sm text-white/85">Planned by {trip.owner.name}</p> : null}
          </div>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
          {trip.description ? <p className="text-sm text-foreground">{trip.description}</p> : <p className="text-sm text-muted">Read-only public itinerary.</p>}
          <CopySharedTripButton slug={slug} />
        </div>
      </section>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="inline-flex items-center gap-2 text-base font-bold text-foreground">
            <WalletIcon className="h-5 w-5 text-primary" />
            Budget
          </h2>
          <Badge>{formatMoney(budget.totals.grandTotal)} total</Badge>
        </div>
        <BudgetHealthBar target={budget.target} />
        <div className="mt-4">
          <BudgetBreakdownChart breakdown={budget.breakdown} />
        </div>
      </Card>

      <div>
        <h2 className="mb-3 inline-flex items-center gap-2 text-xl font-bold text-foreground">
          <CompassIcon className="h-5 w-5 text-primary" />
          Itinerary
        </h2>
        <ItineraryDayList itinerary={itinerary} />
      </div>

      <p className="text-center text-xs text-muted">Shared read-only via GlobeTrotter — no account needed to view.</p>
    </div>
  );
}

import { notFound } from "next/navigation";
import { publicTrips, ApiError } from "@/lib/api/endpoints";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BudgetHealthBar } from "@/components/budget/BudgetHealthBar";
import { BudgetBreakdownChart } from "@/components/budget/BudgetBreakdownChart";
import { ItineraryDayList } from "@/components/itinerary/ItineraryDayList";
import { formatDateRange, formatMoney } from "@/lib/format";
import type { PublicTripResponse } from "@/lib/types";

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

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Shared trip</p>
        <h1 className="mt-1 text-3xl font-semibold text-foreground">{trip.name}</h1>
        <p className="mt-1 text-sm text-muted">{formatDateRange(trip.startDate, trip.endDate)}</p>
        {trip.owner ? <p className="mt-1 text-sm text-muted">Planned by {trip.owner.name}</p> : null}
        {trip.description ? <p className="mx-auto mt-3 max-w-xl text-sm text-foreground">{trip.description}</p> : null}
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">Budget</h2>
          <Badge>{formatMoney(budget.totals.grandTotal)} total</Badge>
        </div>
        <BudgetHealthBar target={budget.target} />
        <div className="mt-4">
          <BudgetBreakdownChart breakdown={budget.breakdown} />
        </div>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Itinerary</h2>
        <ItineraryDayList itinerary={itinerary} />
      </div>

      <p className="text-center text-xs text-muted">Shared read-only via GlobeTrotter — no account needed to view.</p>
    </div>
  );
}

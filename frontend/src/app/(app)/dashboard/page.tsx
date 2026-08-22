"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";
import { Card } from "@/components/ui/Card";
import { PageSpinner } from "@/components/ui/Spinner";
import { ErrorBanner, errorMessage } from "@/components/ui/ErrorBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { TripCard } from "@/components/trips/TripCard";
import { DashboardTripAssistant } from "@/components/ai/DashboardTripAssistant";
import { CalendarIcon, CompassIcon, MapPinIcon, PlusIcon, SparklesIcon } from "@/components/ui/Icons";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useDashboard();

  if (isLoading) return <PageSpinner />;
  if (error) return <ErrorBanner message={errorMessage(error, "Could not load the dashboard")} />;
  if (!data) return null;

  const { stats, recentTrips, upcomingTrips, recommendedCities } = data;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-5 rounded-3xl border border-border bg-white p-5 shadow-sm md:grid-cols-[1fr_auto] md:items-center sm:p-6">
        <div>
          <p className="text-sm font-bold text-primary">Welcome back</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground">{user?.name ?? data.user.name}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Continue a trip, check budget health, or start a fresh route from your travel workspace.
          </p>
        </div>
        <Link href="/trips">
          <Button>
            <PlusIcon className="h-4 w-4" />
            New trip
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-primary">
              <CompassIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-muted">Total trips</p>
              <p className="text-3xl font-bold text-foreground">{stats.tripCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-50 text-teal-700">
              <CalendarIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-muted">Upcoming trips</p>
              <p className="text-3xl font-bold text-foreground">{stats.upcomingCount}</p>
            </div>
          </div>
        </Card>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-foreground">Upcoming trips</h2>
        {upcomingTrips.length === 0 ? (
          <EmptyState title="No upcoming trips yet" description="Create a trip to start planning your next adventure." />
        ) : (
          <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {upcomingTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-foreground">Recent trips</h2>
        {recentTrips.length === 0 ? (
          <EmptyState title="No trips yet" description="Your recently updated trips will show up here." />
        ) : (
          <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recentTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-foreground">Recommended cities</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {recommendedCities.map((city) => (
            <Card key={city.id} className="overflow-hidden">
              <div
                className="aspect-[5/3] bg-[#dddddd]"
                style={
                  city.imageUrl
                    ? { backgroundImage: `url(${city.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                    : undefined
                }
              >
                {!city.imageUrl ? (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-rose-50 via-white to-teal-50 text-primary">
                    <MapPinIcon className="h-8 w-8" />
                  </div>
                ) : null}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-foreground">{city.name}</p>
                    <p className="text-sm text-muted">{city.country}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#f7f7f7] px-2.5 py-1 text-xs font-bold text-foreground">
                    <SparklesIcon className="h-3.5 w-3.5 text-primary" />
                    {city.costIndex}/5
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <DashboardTripAssistant recentTrips={recentTrips} upcomingTrips={upcomingTrips} />
    </div>
  );
}

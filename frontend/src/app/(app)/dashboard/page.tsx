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

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useDashboard();

  if (isLoading) return <PageSpinner />;
  if (error) return <ErrorBanner message={errorMessage(error, "Could not load the dashboard")} />;
  if (!data) return null;

  const { stats, recentTrips, upcomingTrips, recommendedCities } = data;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Welcome back, {user?.name ?? data.user.name}</h1>
          <p className="text-sm text-muted">Here&apos;s what&apos;s happening with your trips.</p>
        </div>
        <Link href="/trips">
          <Button>New trip</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm text-muted">Total trips</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">{stats.tripCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">Upcoming trips</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">{stats.upcomingCount}</p>
        </Card>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Upcoming trips</h2>
        {upcomingTrips.length === 0 ? (
          <EmptyState title="No upcoming trips yet" description="Create a trip to start planning your next adventure." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Recent trips</h2>
        {recentTrips.length === 0 ? (
          <EmptyState title="No trips yet" description="Your recently updated trips will show up here." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Recommended cities</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {recommendedCities.map((city) => (
            <Card key={city.id} className="p-4">
              <p className="font-medium text-foreground">{city.name}</p>
              <p className="text-xs text-muted">{city.country}</p>
              <p className="mt-2 text-xs text-muted">Cost index {city.costIndex}/5</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import clsx from "clsx";
import { useAdminStats } from "@/hooks/useAdmin";
import { AdminBookings } from "@/components/admin/AdminBookings";
import { AdminGuides } from "@/components/admin/AdminGuides";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorBanner, errorMessage } from "@/components/ui/ErrorBanner";
import { CalendarIcon, CompassIcon, ShieldIcon, UsersIcon, WalletIcon } from "@/components/ui/Icons";
import { formatMoney } from "@/lib/format";

const tabs = [
  { value: "bookings", label: "Bookings & assignments", Icon: CalendarIcon },
  { value: "guides", label: "Guides", Icon: CompassIcon },
  { value: "users", label: "People & roles", Icon: UsersIcon },
] as const;

export default function AdminConsolePage() {
  const [tab, setTab] = useState<(typeof tabs)[number]["value"]>("bookings");
  const { data, isLoading, error } = useAdminStats();
  const stats = data?.stats;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5 rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-6">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-bold text-primary">
            <ShieldIcon className="h-4 w-4" />
            Admin console
          </p>
          <h1 className="mt-1 text-3xl font-bold text-foreground">Operations</h1>
          <p className="mt-1 text-sm text-muted">
            Reassign guides, verify profiles, and change who can do what.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner className="h-7 w-7" />
          </div>
        ) : error ? (
          <ErrorBanner message={errorMessage(error, "Could not load the console")} />
        ) : stats ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatCard label="Travellers" value={String(stats.travellers)} Icon={UsersIcon} />
            <StatCard
              label="Guides"
              value={String(stats.guides)}
              hint={`${stats.activeGuides} listed`}
              Icon={CompassIcon}
            />
            <StatCard label="Trips" value={String(stats.trips)} Icon={CalendarIcon} />
            <StatCard
              label="Bookings"
              value={String(stats.bookings)}
              hint={`${stats.pendingBookings} pending`}
              highlight={stats.pendingBookings > 0}
              Icon={CalendarIcon}
            />
            <StatCard label="Booked value" value={formatMoney(stats.bookingRevenue)} Icon={WalletIcon} />
          </div>
        ) : null}

        <div className="scrollbar-hide flex gap-2 overflow-x-auto border-t border-border pt-4">
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
      </div>

      {tab === "bookings" ? <AdminBookings /> : tab === "guides" ? <AdminGuides /> : <AdminUsers />}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  highlight,
  Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
  Icon: typeof UsersIcon;
}) {
  return (
    <Card className={clsx("p-4", highlight && "border-primary bg-rose-50")}>
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </Card>
  );
}

"use client";

import { useState } from "react";
import { useAdminBookings, useDeleteBookingAsAdmin } from "@/hooks/useAdmin";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ReassignBookingModal } from "@/components/admin/ReassignBookingModal";
import { BookingStatusBadge } from "@/components/guides/BookingStatusBadge";
import { GuideAvatar } from "@/components/guides/GuideAvatar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner, errorMessage } from "@/components/ui/ErrorBanner";
import { EditIcon, SearchIcon, TrashIcon } from "@/components/ui/Icons";
import { formatDate, formatMoney } from "@/lib/format";
import type { BookingStatus, SerializedBooking } from "@/lib/types";

const statusFilters: Array<{ value: BookingStatus | undefined; label: string }> = [
  { value: undefined, label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DECLINED", label: "Declined" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function AdminBookings() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BookingStatus | undefined>(undefined);
  const [editing, setEditing] = useState<SerializedBooking | null>(null);
  const [error, setError] = useState<string | null>(null);

  const q = useDebouncedValue(search, 300);
  const { data, isLoading, error: loadError } = useAdminBookings({ q: q || undefined, status });
  const deleteBooking = useDeleteBookingAsAdmin();

  async function onDelete(booking: SerializedBooking) {
    if (!window.confirm(`Delete booking #${booking.id}? This cannot be undone.`)) return;
    setError(null);
    try {
      await deleteBooking.mutateAsync(booking.id);
    } catch (deleteError) {
      setError(errorMessage(deleteError, "Could not delete this booking"));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {error ? <ErrorBanner message={error} /> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full items-center gap-3 rounded-full border border-border bg-white px-4 py-2 shadow-sm focus-within:border-foreground sm:max-w-sm [&>div]:flex-1">
          <SearchIcon className="h-5 w-5 text-primary" />
          <Input
            aria-label="Search bookings"
            placeholder="Traveller, guide, or city"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="border-0 p-0 shadow-none focus:border-0 focus:ring-0"
          />
        </div>
        <div className="scrollbar-hide flex gap-2 overflow-x-auto">
          {statusFilters.map(({ value, label }) => (
            <button
              key={label}
              onClick={() => setStatus(value)}
              className={
                status === value
                  ? "min-w-fit rounded-full bg-foreground px-3.5 py-1.5 text-sm font-bold text-white"
                  : "min-w-fit rounded-full border border-border bg-white px-3.5 py-1.5 text-sm font-semibold text-muted hover:border-foreground hover:text-foreground"
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-7 w-7" />
        </div>
      ) : loadError ? (
        <ErrorBanner message={errorMessage(loadError, "Could not load bookings")} />
      ) : data && data.bookings.length > 0 ? (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Traveller</th>
                <th className="px-4 py-3 font-semibold">Assigned guide</th>
                <th className="px-4 py-3 font-semibold">City</th>
                <th className="px-4 py-3 font-semibold">Days</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-[#fafafa]">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{booking.tourist?.name ?? "—"}</p>
                    <p className="text-xs text-muted">{booking.tourist?.email ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <GuideAvatar
                        name={booking.guide?.name ?? "Guide"}
                        photoUrl={booking.guide?.photoUrl}
                        className="h-8 w-8"
                      />
                      <div>
                        <p className="font-semibold text-foreground">{booking.guide?.name ?? "—"}</p>
                        <p className="text-xs text-muted">{formatMoney(booking.dailyRate)}/day</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{booking.city?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{booking.days}</p>
                    <p className="text-xs text-muted">
                      {formatDate(booking.startDate)} – {formatDate(booking.endDate)}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">{formatMoney(booking.totalCost)}</td>
                  <td className="px-4 py-3">
                    <BookingStatusBadge status={booking.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setEditing(booking)}>
                        <EditIcon className="h-4 w-4" />
                        Reassign
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(booking)}
                        disabled={deleteBooking.isPending}
                        aria-label={`Delete booking ${booking.id}`}
                      >
                        <TrashIcon className="h-4 w-4 text-danger" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <EmptyState title="No bookings match" description="Try a different search or status filter." />
      )}

      <ReassignBookingModal booking={editing} open={editing !== null} onClose={() => setEditing(null)} />
    </div>
  );
}

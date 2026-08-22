"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ErrorBanner, errorMessage } from "@/components/ui/ErrorBanner";
import { GuideAvatar } from "@/components/guides/GuideAvatar";
import { BookingStatusBadge } from "@/components/guides/BookingStatusBadge";
import {
  CalendarIcon,
  CompassIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  StarIcon,
  UsersIcon,
} from "@/components/ui/Icons";
import { useCancelBooking } from "@/hooks/useBookings";
import { formatDate, formatMoney } from "@/lib/format";
import type { SerializedBooking } from "@/lib/types";

/** The traveller's view of one hire: who, which days, and how to reach them. */
export function BookingCard({ booking }: { booking: SerializedBooking }) {
  const [error, setError] = useState<string | null>(null);
  const cancelBooking = useCancelBooking();
  const guide = booking.guide;
  const canCancel = booking.status === "PENDING" || booking.status === "CONFIRMED";
  const contactVisible = Boolean(guide?.phone || guide?.email);

  async function onCancel() {
    if (!window.confirm(`Cancel your booking with ${guide?.name ?? "this guide"}?`)) return;
    setError(null);
    try {
      await cancelBooking.mutateAsync({ id: booking.id });
    } catch (cancelError) {
      setError(errorMessage(cancelError, "Could not cancel this booking"));
    }
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      {error ? <ErrorBanner message={error} /> : null}

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <GuideAvatar name={guide?.name ?? "Guide"} photoUrl={guide?.photoUrl} className="h-14 w-14" />
          <div className="min-w-0">
            <p className="truncate font-bold text-foreground">{guide?.name ?? "Guide"}</p>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
              <MapPinIcon className="h-4 w-4" />
              {booking.city ? `${booking.city.name}, ${booking.city.country}` : "—"}
            </p>
            {guide ? (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                <StarIcon className="h-3.5 w-3.5 text-primary" />
                {guide.rating.toFixed(1)} · {guide.experienceYears} yrs guiding
              </p>
            ) : null}
          </div>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-[#f7f7f7] p-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="flex items-center gap-1 text-xs text-muted">
            <CalendarIcon className="h-3.5 w-3.5" />
            Days
          </dt>
          <dd className="mt-0.5 font-bold text-foreground">{booking.days}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Dates</dt>
          <dd className="mt-0.5 font-semibold text-foreground">
            {formatDate(booking.startDate)} – {formatDate(booking.endDate)}
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-xs text-muted">
            <UsersIcon className="h-3.5 w-3.5" />
            Travellers
          </dt>
          <dd className="mt-0.5 font-bold text-foreground">{booking.headcount}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Total</dt>
          <dd className="mt-0.5 font-bold text-foreground">{formatMoney(booking.totalCost)}</dd>
        </div>
      </dl>

      {guide?.languages.length ? (
        <div className="flex flex-wrap gap-1.5">
          {guide.languages.map((language) => (
            <Badge key={language}>{language}</Badge>
          ))}
        </div>
      ) : null}

      {contactVisible ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Your guide&apos;s details</p>
          <div className="mt-2 flex flex-col gap-1.5 text-sm text-emerald-900">
            {guide?.phone ? (
              <a href={`tel:${guide.phone}`} className="flex items-center gap-2 font-semibold hover:underline">
                <PhoneIcon className="h-4 w-4" />
                {guide.phone}
              </a>
            ) : null}
            {guide?.email ? (
              <a href={`mailto:${guide.email}`} className="flex items-center gap-2 font-semibold hover:underline">
                <MailIcon className="h-4 w-4" />
                {guide.email}
              </a>
            ) : null}
          </div>
          {booking.guideNote ? (
            <p className="mt-3 border-t border-emerald-200 pt-3 text-sm text-emerald-900">
              <span className="font-semibold">Message from {guide?.name?.split(" ")[0]}:</span>{" "}
              {booking.guideNote}
            </p>
          ) : null}
        </div>
      ) : booking.status === "PENDING" ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Waiting on {guide?.name?.split(" ")[0] ?? "your guide"} to accept. Their phone number and
          email unlock the moment they do.
        </p>
      ) : booking.status === "DECLINED" ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {guide?.name ?? "This guide"} could not take these days
          {booking.guideNote ? ` — “${booking.guideNote}”` : "."} Try another guide in{" "}
          {booking.city?.name ?? "this city"}.
        </p>
      ) : null}

      {booking.notes ? (
        <p className="text-sm text-muted">
          <span className="font-semibold text-foreground">Your note:</span> {booking.notes}
        </p>
      ) : null}

      {booking.adminNote ? (
        <p className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-muted">
          <span className="font-semibold text-foreground">From GoVenture support:</span> {booking.adminNote}
        </p>
      ) : null}

      <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
        {booking.trip ? (
          <Link
            href={`/trips/${booking.trip.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <CompassIcon className="h-4 w-4" />
            {booking.trip.name}
          </Link>
        ) : (
          <span className="text-sm text-muted">Not linked to a trip</span>
        )}
        {canCancel ? (
          <Button size="sm" variant="secondary" onClick={onCancel} disabled={cancelBooking.isPending}>
            {cancelBooking.isPending ? "Cancelling…" : "Cancel booking"}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { ErrorBanner, errorMessage } from "@/components/ui/ErrorBanner";
import { GuideAvatar } from "@/components/guides/GuideAvatar";
import { BookingStatusBadge } from "@/components/guides/BookingStatusBadge";
import {
  CalendarIcon,
  CheckIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  UsersIcon,
  XIcon,
} from "@/components/ui/Icons";
import { useRespondToAssignment } from "@/hooks/useGuides";
import { formatDate, formatMoney } from "@/lib/format";
import type { SerializedBooking } from "@/lib/types";

/** The guide's view of one assignment: which tourist, which days, accept or not. */
export function AssignmentCard({ booking }: { booking: SerializedBooking }) {
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const respond = useRespondToAssignment();

  const tourist = booking.tourist;
  const isPending = booking.status === "PENDING";
  const isConfirmed = booking.status === "CONFIRMED";

  async function act(status: "CONFIRMED" | "DECLINED" | "COMPLETED") {
    setError(null);
    try {
      await respond.mutateAsync({
        bookingId: booking.id,
        status,
        guideNote: note.trim() || undefined,
      });
      setShowNote(false);
      setNote("");
    } catch (actionError) {
      setError(errorMessage(actionError, "Could not update this booking"));
    }
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      {error ? <ErrorBanner message={error} /> : null}

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <GuideAvatar name={tourist?.name ?? "Traveller"} photoUrl={tourist?.photoUrl} className="h-12 w-12" />
          <div className="min-w-0">
            <p className="truncate font-bold text-foreground">{tourist?.name ?? "Traveller"}</p>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
              <MapPinIcon className="h-4 w-4" />
              {booking.city ? `${booking.city.name}, ${booking.city.country}` : "—"}
            </p>
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
            Group
          </dt>
          <dd className="mt-0.5 font-bold text-foreground">{booking.headcount}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">You earn</dt>
          <dd className="mt-0.5 font-bold text-foreground">{formatMoney(booking.totalCost)}</dd>
        </div>
      </dl>

      {booking.notes ? (
        <p className="text-sm text-muted">
          <span className="font-semibold text-foreground">Their note:</span> {booking.notes}
        </p>
      ) : null}

      {booking.adminNote ? (
        <p className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-muted">
          <span className="font-semibold text-foreground">From GoVenture support:</span> {booking.adminNote}
        </p>
      ) : null}

      {tourist?.phone || tourist?.email ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Traveller contact</p>
          <div className="mt-2 flex flex-col gap-1.5 text-sm text-emerald-900">
            {tourist.phone ? (
              <a href={`tel:${tourist.phone}`} className="flex items-center gap-2 font-semibold hover:underline">
                <PhoneIcon className="h-4 w-4" />
                {tourist.phone}
              </a>
            ) : null}
            {tourist.email ? (
              <a href={`mailto:${tourist.email}`} className="flex items-center gap-2 font-semibold hover:underline">
                <MailIcon className="h-4 w-4" />
                {tourist.email}
              </a>
            ) : null}
          </div>
        </div>
      ) : isPending ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Accept to see how to reach them.
        </p>
      ) : null}

      {booking.guideNote ? (
        <p className="text-sm text-muted">
          <span className="font-semibold text-foreground">Your reply:</span> {booking.guideNote}
        </p>
      ) : null}

      {isPending || isConfirmed ? (
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          {showNote ? (
            <Textarea
              label="Message to the traveller (optional)"
              rows={2}
              placeholder="Where you'll meet, what to bring…"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowNote(true)}
              className="self-start text-sm font-semibold text-primary hover:underline"
            >
              Add a message
            </button>
          )}

          <div className="flex flex-wrap gap-2">
            {isPending ? (
              <>
                <Button size="sm" onClick={() => act("CONFIRMED")} disabled={respond.isPending}>
                  <CheckIcon className="h-4 w-4" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => act("DECLINED")}
                  disabled={respond.isPending}
                >
                  <XIcon className="h-4 w-4" />
                  Decline
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" onClick={() => act("COMPLETED")} disabled={respond.isPending}>
                  <CheckIcon className="h-4 w-4" />
                  Mark completed
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => act("DECLINED")}
                  disabled={respond.isPending}
                >
                  Cancel this booking
                </Button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

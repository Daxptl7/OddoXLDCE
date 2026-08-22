"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { ErrorBanner, errorMessage } from "@/components/ui/ErrorBanner";
import { GuideAvatar } from "@/components/guides/GuideAvatar";
import { useAdminGuides, useUpdateBookingAsAdmin } from "@/hooks/useAdmin";
import { formatMoney } from "@/lib/format";
import type { BookingStatus, SerializedBooking } from "@/lib/types";

const statuses: BookingStatus[] = ["PENDING", "CONFIRMED", "DECLINED", "CANCELLED", "COMPLETED"];

const dayCount = (start: string, end: string): number => {
  if (!start || !end || end < start) return 0;
  const ms = new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime();
  return Math.round(ms / 86_400_000) + 1;
};

/**
 * The admin's editing surface for one booking: swap the guide, move the days,
 * force a status. Anything that would double-book a guide is refused unless the
 * admin ticks the override, which the API also enforces.
 */
export function ReassignBookingModal({
  booking,
  open,
  onClose,
}: {
  booking: SerializedBooking | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!booking) return null;
  // Keyed on the booking id so opening a different row remounts the form with
  // that row's values, instead of syncing props into state inside an effect.
  return <ReassignForm key={booking.id} booking={booking} open={open} onClose={onClose} />;
}

function ReassignForm({
  booking,
  open,
  onClose,
}: {
  booking: SerializedBooking;
  open: boolean;
  onClose: () => void;
}) {
  const [guideId, setGuideId] = useState<number>(booking.guideId);
  const [status, setStatus] = useState<BookingStatus>(booking.status);
  const [startDate, setStartDate] = useState(booking.startDate ?? "");
  const [endDate, setEndDate] = useState(booking.endDate ?? "");
  const [headcount, setHeadcount] = useState(booking.headcount);
  const [adminNote, setAdminNote] = useState(booking.adminNote ?? "");
  const [force, setForce] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: guideData } = useAdminGuides({ status: "active" });
  const updateBooking = useUpdateBookingAsAdmin();

  const selectedGuide = guideData?.guides.find((guide) => guide.id === guideId);
  const days = dayCount(startDate, endDate);
  const rate = selectedGuide && guideId !== booking.guideId ? selectedGuide.dailyRate : booking.dailyRate;
  const guideChanged = guideId !== booking.guideId;

  async function onSave() {
    setError(null);
    try {
      await updateBooking.mutateAsync({
        bookingId: booking.id,
        guideId,
        status,
        startDate,
        endDate,
        headcount: Number(headcount),
        adminNote: adminNote.trim() || null,
        force,
      });
      onClose();
    } catch (saveError) {
      setError(errorMessage(saveError, "Could not update this booking"));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Booking #${booking.id}`} maxWidth="max-w-2xl">
      <div className="flex flex-col gap-4">
        {error ? <ErrorBanner message={error} /> : null}

        <div className="rounded-2xl bg-[#f7f7f7] p-4 text-sm">
          <p className="font-bold text-foreground">{booking.tourist?.name ?? "Traveller"}</p>
          <p className="mt-0.5 text-muted">
            {booking.city ? `${booking.city.name}, ${booking.city.country}` : "—"}
            {booking.trip ? ` · ${booking.trip.name}` : ""}
          </p>
          {booking.notes ? <p className="mt-2 text-muted">“{booking.notes}”</p> : null}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="guideId" className="text-sm font-semibold text-foreground">
            Assigned guide
          </label>
          <select
            id="guideId"
            value={guideId}
            onChange={(event) => setGuideId(Number(event.target.value))}
            className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-foreground focus:ring-1 focus:ring-foreground"
          >
            {/* The current guide may be paused and missing from the active list. */}
            {!guideData?.guides.some((guide) => guide.id === booking.guideId) && booking.guide ? (
              <option value={booking.guide.id}>
                {booking.guide.name} — {booking.guide.city?.name} (current)
              </option>
            ) : null}
            {guideData?.guides.map((guide) => (
              <option key={guide.id} value={guide.id}>
                {guide.name} — {guide.city?.name ?? "?"} · {formatMoney(guide.dailyRate)}/day
              </option>
            ))}
          </select>
        </div>

        {selectedGuide ? (
          <div className="flex items-center gap-3 rounded-2xl border border-border p-3">
            <GuideAvatar name={selectedGuide.name} photoUrl={selectedGuide.photoUrl} className="h-10 w-10" />
            <div className="min-w-0 text-sm">
              <p className="font-semibold text-foreground">{selectedGuide.name}</p>
              <p className="text-muted">
                {selectedGuide.email ?? "—"}
                {selectedGuide.phone ? ` · ${selectedGuide.phone}` : ""}
              </p>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="First day"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
          <Input
            label="Last day"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Travellers"
            type="number"
            min={1}
            max={30}
            value={headcount}
            onChange={(event) => setHeadcount(Number(event.target.value))}
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="status" className="text-sm font-semibold text-foreground">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(event) => setStatus(event.target.value as BookingStatus)}
              className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-foreground focus:ring-1 focus:ring-foreground"
            >
              {statuses.map((value) => (
                <option key={value} value={value}>
                  {value.charAt(0) + value.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Textarea
          label="Note for the traveller and guide (optional)"
          rows={2}
          value={adminNote}
          onChange={(event) => setAdminNote(event.target.value)}
          placeholder="Marco is unwell — Amelie is taking these days instead."
        />

        <div className="flex items-center justify-between rounded-2xl border border-border p-4 text-sm">
          <span className="text-muted">
            {days} day{days === 1 ? "" : "s"} × {formatMoney(rate)}
            {guideChanged ? " (re-priced to the new guide's rate)" : ""}
          </span>
          <span className="text-lg font-bold text-foreground">{formatMoney(days * rate)}</span>
        </div>

        <label className="flex items-start gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={force}
            onChange={(event) => setForce(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border"
          />
          Override the double-booking check (only if you know the guide can cover both)
        </label>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={updateBooking.isPending || days === 0}>
            {updateBooking.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { ErrorBanner, errorMessage } from "@/components/ui/ErrorBanner";
import { GuideAvatar } from "@/components/guides/GuideAvatar";
import { CalendarIcon, MapPinIcon } from "@/components/ui/Icons";
import { useCreateBooking } from "@/hooks/useBookings";
import { useGuide } from "@/hooks/useGuides";
import { useTrips } from "@/hooks/useTrips";
import { formatDate, formatMoney } from "@/lib/format";
import type { SerializedGuide } from "@/lib/types";

const schema = z
  .object({
    startDate: z.string().min(1, "Pick your first day"),
    endDate: z.string().min(1, "Pick your last day"),
    headcount: z.coerce.number().int().min(1, "At least one traveller").max(30),
    tripId: z.string().optional(),
    notes: z.string().max(500).optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "The last day cannot be before the first day",
    path: ["endDate"],
  });

type FormValues = z.input<typeof schema>;

/** Inclusive day count — hiring someone for the 1st to the 3rd is three days. */
function dayCount(start: string, end: string): number {
  if (!start || !end || end < start) return 0;
  const ms = new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

interface BookGuideModalProps {
  guide: SerializedGuide | null;
  open: boolean;
  onClose: () => void;
  defaultTripId?: number;
  defaultStartDate?: string;
  defaultEndDate?: string;
}

export function BookGuideModal({ guide, open, ...rest }: BookGuideModalProps) {
  if (!guide || !open) return null;
  // Mounted only while open and keyed on the guide, so the form always starts
  // from that guide's defaults without syncing props into state.
  return <BookGuideForm key={guide.id} guide={guide} {...rest} />;
}

function BookGuideForm({
  guide,
  onClose,
  defaultTripId,
  defaultStartDate,
  defaultEndDate,
}: Omit<BookGuideModalProps, "guide" | "open"> & { guide: SerializedGuide }) {
  const [formError, setFormError] = useState<string | null>(null);
  const createBooking = useCreateBooking();
  const { data: tripData } = useTrips({ scope: "all" });
  const { data: guideDetail } = useGuide(guide.id);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      startDate: defaultStartDate ?? "",
      endDate: defaultEndDate ?? "",
      headcount: 1,
      tripId: defaultTripId ? String(defaultTripId) : "",
      notes: "",
    },
  });

  const startDate = useWatch({ control, name: "startDate" }) ?? "";
  const endDate = useWatch({ control, name: "endDate" }) ?? "";
  const days = dayCount(startDate, endDate);

  // Warn before the server has to: these ranges are already taken.
  const clash = useMemo(() => {
    if (!guideDetail || !startDate || !endDate) return null;
    return guideDetail.busyRanges.find(
      (range) => range.startDate <= endDate && range.endDate >= startDate,
    );
  }, [guideDetail, startDate, endDate]);

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      await createBooking.mutateAsync({
        guideId: guide.id,
        startDate: values.startDate,
        endDate: values.endDate,
        headcount: Number(values.headcount),
        tripId: values.tripId ? Number(values.tripId) : null,
        notes: values.notes?.trim() ? values.notes.trim() : null,
      });
      onClose();
    } catch (error) {
      setFormError(errorMessage(error, "Could not book this guide"));
    }
  }

  return (
    <Modal open onClose={onClose} title={`Hire ${guide.name}`}>
      <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#f7f7f7] p-4">
        <GuideAvatar name={guide.name} photoUrl={guide.photoUrl} />
        <div className="min-w-0">
          <p className="truncate font-bold text-foreground">{guide.name}</p>
          <p className="flex items-center gap-1 text-sm text-muted">
            <MapPinIcon className="h-4 w-4" />
            {guide.city ? `${guide.city.name}, ${guide.city.country}` : "—"} ·{" "}
            {formatMoney(guide.dailyRate)}/day
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {formError ? <ErrorBanner message={formError} /> : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="First day" type="date" error={errors.startDate?.message} {...register("startDate")} />
          <Input label="Last day" type="date" error={errors.endDate?.message} {...register("endDate")} />
        </div>

        {clash ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {guide.name} is already booked {formatDate(clash.startDate)} – {formatDate(clash.endDate)}.
            Pick different days.
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Travellers"
            type="number"
            min={1}
            max={30}
            error={errors.headcount?.message}
            {...register("headcount")}
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="tripId" className="text-sm font-semibold text-foreground">
              Attach to a trip (optional)
            </label>
            <select
              id="tripId"
              className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-foreground focus:ring-1 focus:ring-foreground"
              {...register("tripId")}
            >
              <option value="">No trip</option>
              {tripData?.trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Textarea
          label="Anything the guide should know? (optional)"
          rows={3}
          placeholder="First time here, travelling with kids, want a slow pace…"
          error={errors.notes?.message}
          {...register("notes")}
        />

        <div className="flex items-center justify-between rounded-2xl border border-border bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-muted">
            <CalendarIcon className="h-4 w-4" />
            {days > 0 ? `${days} day${days === 1 ? "" : "s"} × ${formatMoney(guide.dailyRate)}` : "Pick your dates"}
          </div>
          <p className="text-lg font-bold text-foreground">{formatMoney(days * guide.dailyRate)}</p>
        </div>

        <p className="text-xs text-muted">
          The guide has to accept before it is confirmed. You will see their phone number and email
          here as soon as they do.
        </p>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || days === 0}>
            {isSubmitting ? "Requesting…" : "Request booking"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

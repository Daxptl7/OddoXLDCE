"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, errorMessage } from "@/components/ui/ErrorBanner";
import { CitySearchCombobox } from "./CitySearchCombobox";
import { useAddStop, useUpdateStop } from "@/hooks/useStops";
import type { SerializedCity, SerializedStop } from "@/lib/types";

const numericField = z
  .string()
  .trim()
  .refine((value) => value === "" || (!Number.isNaN(Number(value)) && Number(value) >= 0), {
    message: "Enter a valid, non-negative amount",
  });

const schema = z
  .object({
    arrivalDate: z.string().min(1, "Arrival date is required"),
    departureDate: z.string().min(1, "Departure date is required"),
    transportCost: numericField,
    accommodationCost: numericField,
    notes: z.string().trim().max(1000),
  })
  .refine((data) => data.departureDate >= data.arrivalDate, {
    message: "Departure must be on or after arrival",
    path: ["departureDate"],
  });

type FormValues = z.infer<typeof schema>;

export function StopFormModal({
  tripId,
  open,
  onClose,
  stop,
}: {
  tripId: number;
  open: boolean;
  onClose: () => void;
  stop?: SerializedStop;
}) {
  const isEditing = Boolean(stop);
  const [city, setCity] = useState<SerializedCity | null>(stop?.city ?? null);
  const [formError, setFormError] = useState<string | null>(null);
  const addStop = useAddStop(tripId);
  const updateStop = useUpdateStop(tripId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      arrivalDate: stop?.arrivalDate ?? "",
      departureDate: stop?.departureDate ?? "",
      transportCost: stop ? String(stop.transportCost) : "",
      accommodationCost: stop ? String(stop.accommodationCost) : "",
      notes: stop?.notes ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    if (!city) {
      setFormError("Pick a city for this stop");
      return;
    }
    const data = {
      cityId: city.id,
      arrivalDate: values.arrivalDate,
      departureDate: values.departureDate,
      transportCost: values.transportCost === "" ? undefined : Number(values.transportCost),
      accommodationCost: values.accommodationCost === "" ? undefined : Number(values.accommodationCost),
      notes: values.notes || null,
    };
    try {
      if (isEditing && stop) {
        await updateStop.mutateAsync({ stopId: stop.id, data });
      } else {
        await addStop.mutateAsync(data);
      }
      reset();
      setCity(null);
      onClose();
    } catch (error) {
      setFormError(errorMessage(error, "Could not save this stop"));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Edit stop" : "Add a stop"}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {formError ? <ErrorBanner message={formError} /> : null}
        <CitySearchCombobox value={city} onChange={setCity} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Arrival date" type="date" error={errors.arrivalDate?.message} {...register("arrivalDate")} />
          <Input
            label="Departure date"
            type="date"
            error={errors.departureDate?.message}
            {...register("departureDate")}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Transport cost"
            type="number"
            min={0}
            step="0.01"
            error={errors.transportCost?.message}
            {...register("transportCost")}
          />
          <Input
            label="Accommodation cost"
            type="number"
            min={0}
            step="0.01"
            error={errors.accommodationCost?.message}
            {...register("accommodationCost")}
          />
        </div>
        <Textarea label="Notes (optional)" rows={2} {...register("notes")} />
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Add stop"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

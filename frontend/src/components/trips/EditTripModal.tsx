"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, errorMessage } from "@/components/ui/ErrorBanner";
import { useUpdateTrip } from "@/hooks/useTrip";
import type { SerializedTrip } from "@/lib/types";

const schema = z
  .object({
    name: z.string().trim().min(2, "Give your trip a name").max(120),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    description: z.string().trim().max(2000),
    targetBudget: z
      .string()
      .trim()
      .refine((value) => value === "" || (!Number.isNaN(Number(value)) && Number(value) > 0), {
        message: "Enter a positive amount",
      }),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

type FormValues = z.infer<typeof schema>;

export function EditTripModal({ trip, open, onClose }: { trip: SerializedTrip; open: boolean; onClose: () => void }) {
  const updateTrip = useUpdateTrip(trip.id);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: trip.name,
      startDate: trip.startDate ?? "",
      endDate: trip.endDate ?? "",
      description: trip.description ?? "",
      targetBudget: trip.targetBudget !== null ? String(trip.targetBudget) : "",
    },
  });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      await updateTrip.mutateAsync({
        name: values.name,
        startDate: values.startDate,
        endDate: values.endDate,
        description: values.description || null,
        targetBudget: values.targetBudget === "" ? null : Number(values.targetBudget),
      });
      onClose();
    } catch (error) {
      setFormError(errorMessage(error, "Could not update the trip"));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit trip">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {formError ? <ErrorBanner message={formError} /> : null}
        <Input label="Trip name" error={errors.name?.message} {...register("name")} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Start date" type="date" error={errors.startDate?.message} {...register("startDate")} />
          <Input label="End date" type="date" error={errors.endDate?.message} {...register("endDate")} />
        </div>
        <Input
          label="Target budget"
          type="number"
          min={0}
          step="0.01"
          error={errors.targetBudget?.message}
          {...register("targetBudget")}
        />
        <Textarea label="Description" rows={3} {...register("description")} />
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

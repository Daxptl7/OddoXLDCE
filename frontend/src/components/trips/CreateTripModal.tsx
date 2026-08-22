"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, errorMessage } from "@/components/ui/ErrorBanner";
import { useCreateTrip } from "@/hooks/useTrips";

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

export function CreateTripModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const createTrip = useCreateTrip();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      const { trip } = await createTrip.mutateAsync({
        name: values.name,
        startDate: values.startDate,
        endDate: values.endDate,
        description: values.description || null,
        targetBudget: values.targetBudget === "" ? null : Number(values.targetBudget),
      });
      reset();
      onClose();
      router.push(`/trips/${trip.id}`);
    } catch (error) {
      setFormError(errorMessage(error, "Could not create the trip"));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New trip">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {formError ? <ErrorBanner message={formError} /> : null}
        <Input label="Trip name" placeholder="Europe Summer 2026" error={errors.name?.message} {...register("name")} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Start date" type="date" error={errors.startDate?.message} {...register("startDate")} />
          <Input label="End date" type="date" error={errors.endDate?.message} {...register("endDate")} />
        </div>
        <Input
          label="Target budget (optional)"
          type="number"
          min={0}
          step="1"
          placeholder="150000"
          error={errors.targetBudget?.message}
          {...register("targetBudget")}
        />
        <Textarea label="Description (optional)" rows={3} {...register("description")} />
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create trip"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

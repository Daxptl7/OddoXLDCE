"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMyGuideProfile, useUpdateMyGuideProfile } from "@/hooks/useGuides";
import { useAuth } from "@/lib/auth/AuthContext";
import { auth } from "@/lib/api/endpoints";
import { CitySearchCombobox } from "@/components/trips/CitySearchCombobox";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { ErrorBanner, errorMessage } from "@/components/ui/ErrorBanner";
import type { SerializedCity } from "@/lib/types";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  phone: z.string().trim().max(24),
  headline: z.string().trim().max(120),
  bio: z.string().trim().max(1000),
  languages: z.string().trim().max(200),
  specialties: z.string().trim().max(200),
  dailyRate: z.coerce.number().min(0, "Rate cannot be negative").max(9_999_999),
  experienceYears: z.coerce.number().int().min(0).max(60),
});

type FormValues = z.input<typeof schema>;

/** "English, French" → ["English", "French"] */
const toList = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export default function GuideProfilePage() {
  const { data, isLoading, error } = useMyGuideProfile();
  if (isLoading) return <PageSpinner />;
  if (error) return <ErrorBanner message={errorMessage(error, "Could not load your guide profile")} />;
  if (!data) return null;
  return <GuideProfileForm />;
}

function GuideProfileForm() {
  const { user, refresh } = useAuth();
  const { data } = useMyGuideProfile();
  const updateProfile = useUpdateMyGuideProfile();
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [city, setCity] = useState<SerializedCity | null>(data?.guide.city ?? null);

  const guide = data!.guide;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? guide.name,
      phone: user?.phone ?? "",
      headline: guide.headline ?? "",
      bio: guide.bio ?? "",
      languages: guide.languages.join(", "),
      specialties: guide.specialties.join(", "),
      dailyRate: guide.dailyRate,
      experienceYears: guide.experienceYears,
    },
  });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    setSaved(false);
    try {
      // The account fields live on the user, the rest on the guide profile.
      await auth.updateProfile({ name: values.name, phone: values.phone.trim() || null });
      await updateProfile.mutateAsync({
        headline: values.headline.trim() || null,
        bio: values.bio.trim() || null,
        languages: toList(values.languages),
        specialties: toList(values.specialties),
        dailyRate: Number(values.dailyRate),
        experienceYears: Number(values.experienceYears),
        ...(city && city.id !== guide.cityId ? { cityId: city.id } : {}),
      });
      await refresh();
      setSaved(true);
    } catch (error) {
      setFormError(errorMessage(error, "Could not save your profile"));
    }
  }

  async function toggleListing() {
    setFormError(null);
    try {
      await updateProfile.mutateAsync({ isActive: !guide.isActive });
    } catch (error) {
      setFormError(errorMessage(error, "Could not change your listing"));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Guide profile</h1>
          <p className="mt-1 text-sm text-muted">This is what travellers see before they hire you.</p>
        </div>
        <Link href="/guide" className="text-sm font-semibold text-primary hover:underline">
          ← Back to assignments
        </Link>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          {guide.isActive ? <Badge tone="success">Listed in the directory</Badge> : <Badge tone="warning">Hidden</Badge>}
          {guide.isVerified ? <Badge tone="info">Verified</Badge> : <Badge>Awaiting verification</Badge>}
        </div>
        <Button variant="secondary" size="sm" onClick={toggleListing} disabled={updateProfile.isPending}>
          {guide.isActive ? "Pause new bookings" : "Start taking bookings"}
        </Button>
      </Card>

      <Card className="max-w-2xl p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {formError ? <ErrorBanner message={formError} /> : null}
          {saved ? <p className="text-sm text-success">Profile saved.</p> : null}

          <Input label="Email" value={user?.email ?? ""} disabled />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Name" error={errors.name?.message} {...register("name")} />
            <Input
              label="Phone (travellers see this once confirmed)"
              placeholder="+33 6 12 34 56 78"
              error={errors.phone?.message}
              {...register("phone")}
            />
          </div>

          <CitySearchCombobox value={city} onChange={setCity} />
          <p className="-mt-2 text-xs text-muted">
            Currently guiding in {guide.city ? `${guide.city.name}, ${guide.city.country}` : "—"}
            {city && city.id !== guide.cityId ? ` — will change to ${city.name}` : ""}
          </p>

          <Input
            label="Headline"
            placeholder="Paris born and raised — museums, markets, and the quiet streets"
            error={errors.headline?.message}
            {...register("headline")}
          />
          <Textarea label="About you" rows={4} error={errors.bio?.message} {...register("bio")} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Languages (comma separated)"
              placeholder="English, French"
              error={errors.languages?.message}
              {...register("languages")}
            />
            <Input
              label="Specialties (comma separated)"
              placeholder="Museums, Food, Photography"
              error={errors.specialties?.message}
              {...register("specialties")}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Daily rate (₹)"
              type="number"
              min={0}
              step={100}
              error={errors.dailyRate?.message}
              {...register("dailyRate")}
            />
            <Input
              label="Years guiding"
              type="number"
              min={0}
              max={60}
              error={errors.experienceYears?.message}
              {...register("experienceYears")}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="self-start">
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

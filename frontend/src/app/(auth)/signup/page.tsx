"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import clsx from "clsx";
import { useAuth } from "@/lib/auth/AuthContext";
import { homePathFor } from "@/lib/auth/roles";
import { CitySearchCombobox } from "@/components/trips/CitySearchCombobox";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ErrorBanner, errorMessage } from "@/components/ui/ErrorBanner";
import { CompassIcon, UsersIcon } from "@/components/ui/Icons";
import type { SerializedCity } from "@/lib/types";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  phone: z.string().trim().max(24).optional(),
  headline: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(1000).optional(),
  languages: z.string().trim().max(200).optional(),
  dailyRate: z.string().trim().optional(),
  experienceYears: z.string().trim().optional(),
});

type FormValues = z.input<typeof schema>;

const toList = (value?: string): string[] =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<"USER" | "GUIDE">("USER");
  const [city, setCity] = useState<SerializedCity | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setFormError(null);

    if (role === "GUIDE") {
      if (!city) {
        setFormError("Pick the city you guide in");
        return;
      }
      if (!values.dailyRate || Number(values.dailyRate) <= 0) {
        setFormError("Tell travellers your daily rate");
        return;
      }
    }

    try {
      const account = await signup({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone?.trim() ? values.phone.trim() : null,
        role,
        ...(role === "GUIDE"
          ? {
              guideProfile: {
                cityId: city!.id,
                headline: values.headline?.trim() || null,
                bio: values.bio?.trim() || null,
                languages: toList(values.languages),
                specialties: [],
                dailyRate: Number(values.dailyRate),
                experienceYears: Number(values.experienceYears ?? 0) || 0,
              },
            }
          : {}),
      });
      router.push(homePathFor(account.role));
    } catch (error) {
      setFormError(errorMessage(error, "Could not create your account"));
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-5 grid grid-cols-2 gap-2">
        <RoleTile
          active={role === "USER"}
          onClick={() => setRole("USER")}
          Icon={CompassIcon}
          title="I'm travelling"
          subtitle="Plan trips, hire guides"
        />
        <RoleTile
          active={role === "GUIDE"}
          onClick={() => setRole("GUIDE")}
          Icon={UsersIcon}
          title="I'm a guide"
          subtitle="Get hired in my city"
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {formError ? <ErrorBanner message={formError} /> : null}
        <Input label="Name" autoComplete="name" error={errors.name?.message} {...register("name")} />
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label={role === "GUIDE" ? "Phone" : "Phone (optional)"}
          placeholder="+91 98765 43210"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register("phone")}
        />

        {role === "GUIDE" ? (
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-[#fafafa] p-4">
            <p className="text-sm font-bold text-foreground">Your guiding profile</p>
            <CitySearchCombobox value={city} onChange={setCity} />
            <Input
              label="Headline"
              placeholder="Paris born and raised — museums, markets, quiet streets"
              error={errors.headline?.message}
              {...register("headline")}
            />
            <div className="grid grid-cols-2 gap-3">
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
            <Input
              label="Languages (comma separated)"
              placeholder="English, French"
              error={errors.languages?.message}
              {...register("languages")}
            />
            <Textarea label="About you" rows={3} error={errors.bio?.message} {...register("bio")} />
          </div>
        ) : null}

        <Button type="submit" disabled={isSubmitting} className="mt-2">
          {isSubmitting ? "Creating account…" : role === "GUIDE" ? "Create guide account" : "Create account"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}

function RoleTile({
  active,
  onClick,
  Icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  Icon: typeof CompassIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-colors",
        active ? "border-foreground bg-[#f7f7f7]" : "border-border bg-white hover:border-foreground",
      )}
    >
      <Icon className={clsx("h-5 w-5", active ? "text-primary" : "text-muted")} />
      <span className="text-sm font-bold text-foreground">{title}</span>
      <span className="text-xs text-muted">{subtitle}</span>
    </button>
  );
}

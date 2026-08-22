"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth/AuthContext";
import { homePathFor } from "@/lib/auth/roles";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ErrorBanner, errorMessage } from "@/components/ui/ErrorBanner";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      // Each role has a different landing page; an explicit ?redirect wins.
      const signedIn = await login(values.email, values.password);
      router.push(searchParams?.get("redirect") ?? homePathFor(signedIn.role));
    } catch (error) {
      setFormError(errorMessage(error, "Could not sign in"));
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {formError ? <ErrorBanner message={formError} /> : null}
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Button type="submit" disabled={isSubmitting} className="mt-2">
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        New to GoVenture?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
      <div className="mt-4 space-y-1 rounded-xl bg-[#f7f7f7] px-3 py-2.5 text-center text-xs text-muted">
        <p className="font-semibold text-foreground">Demo logins</p>
        <p>
          Traveller: <span className="font-mono">demo@globetrotter.app</span> /{" "}
          <span className="font-mono">demo1234</span>
        </p>
        <p>
          Guide: <span className="font-mono">amelie@guides.globetrotter.app</span> /{" "}
          <span className="font-mono">guide1234</span>
        </p>
        <p>
          Admin: <span className="font-mono">admin@globetrotter.app</span> /{" "}
          <span className="font-mono">admin1234</span>
        </p>
      </div>
    </Card>
  );
}

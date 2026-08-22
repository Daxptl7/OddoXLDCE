"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth/AuthContext";
import { auth } from "@/lib/api/endpoints";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, errorMessage } from "@/components/ui/ErrorBanner";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  photoUrl: z.string().trim().url("Enter a valid URL").or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? "", photoUrl: user?.photoUrl ?? "" },
  });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    setSaved(false);
    try {
      await auth.updateProfile({ name: values.name, photoUrl: values.photoUrl || null });
      await refresh();
      setSaved(true);
    } catch (error) {
      setFormError(errorMessage(error, "Could not update your profile"));
    }
  }

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-foreground">Profile</h1>
      <Card className="max-w-md p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {formError ? <ErrorBanner message={formError} /> : null}
          {saved ? <p className="text-sm text-success">Profile updated.</p> : null}
          <Input label="Email" value={user.email} disabled />
          <Input label="Name" error={errors.name?.message} {...register("name")} />
          <Input label="Photo URL (optional)" error={errors.photoUrl?.message} {...register("photoUrl")} />
          <Button type="submit" disabled={isSubmitting} className="self-start">
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

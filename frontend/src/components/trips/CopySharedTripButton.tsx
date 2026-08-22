"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { publicTrips } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, errorMessage } from "@/components/ui/ErrorBanner";
import { CopyIcon } from "@/components/ui/Icons";

export function CopySharedTripButton({ slug }: { slug: string }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isCopying, setIsCopying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function copyTrip() {
    setError(null);
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/t/${slug}`)}`);
      return;
    }

    setIsCopying(true);
    try {
      const { trip } = await publicTrips.copy(slug);
      router.push(`/trips/${trip.id}`);
    } catch (err) {
      setError(errorMessage(err, "Could not copy this trip"));
    } finally {
      setIsCopying(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={copyTrip} disabled={isLoading || isCopying}>
        <CopyIcon className="h-4 w-4" />
        {isCopying ? "Copying..." : "Copy this trip"}
      </Button>
      {error ? <ErrorBanner message={error} /> : null}
    </div>
  );
}

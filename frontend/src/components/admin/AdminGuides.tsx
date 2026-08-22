"use client";

import { useState } from "react";
import { useAdminGuides, useUpdateGuideAsAdmin } from "@/hooks/useAdmin";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { GuideAvatar } from "@/components/guides/GuideAvatar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner, errorMessage } from "@/components/ui/ErrorBanner";
import { SearchIcon } from "@/components/ui/Icons";
import { formatMoney } from "@/lib/format";

const filters = [
  { value: "all", label: "All" },
  { value: "active", label: "Listed" },
  { value: "inactive", label: "Paused" },
  { value: "unverified", label: "Unverified" },
] as const;

export function AdminGuides() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof filters)[number]["value"]>("all");
  const [error, setError] = useState<string | null>(null);
  const [editingRate, setEditingRate] = useState<{ id: number; value: string } | null>(null);

  const q = useDebouncedValue(search, 300);
  const { data, isLoading, error: loadError } = useAdminGuides({ q: q || undefined, status });
  const updateGuide = useUpdateGuideAsAdmin();

  async function patch(guideId: number, data: { isActive?: boolean; isVerified?: boolean; dailyRate?: number }) {
    setError(null);
    try {
      await updateGuide.mutateAsync({ guideId, ...data });
    } catch (patchError) {
      setError(errorMessage(patchError, "Could not update this guide"));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {error ? <ErrorBanner message={error} /> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full items-center gap-3 rounded-full border border-border bg-white px-4 py-2 shadow-sm focus-within:border-foreground sm:max-w-sm [&>div]:flex-1">
          <SearchIcon className="h-5 w-5 text-primary" />
          <Input
            aria-label="Search guides"
            placeholder="Name, email, or city"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="border-0 p-0 shadow-none focus:border-0 focus:ring-0"
          />
        </div>
        <div className="scrollbar-hide flex gap-2 overflow-x-auto">
          {filters.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatus(value)}
              className={
                status === value
                  ? "min-w-fit rounded-full bg-foreground px-3.5 py-1.5 text-sm font-bold text-white"
                  : "min-w-fit rounded-full border border-border bg-white px-3.5 py-1.5 text-sm font-semibold text-muted hover:border-foreground hover:text-foreground"
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-7 w-7" />
        </div>
      ) : loadError ? (
        <ErrorBanner message={errorMessage(loadError, "Could not load guides")} />
      ) : data && data.guides.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.guides.map((guide) => (
            <Card key={guide.id} className="flex flex-col gap-4 p-5">
              <div className="flex items-start gap-3">
                <GuideAvatar name={guide.name} photoUrl={guide.photoUrl} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-foreground">{guide.name}</p>
                  <p className="truncate text-sm text-muted">{guide.email ?? "—"}</p>
                  <p className="text-sm text-muted">
                    {guide.city ? `${guide.city.name}, ${guide.city.country}` : "—"} ·{" "}
                    {guide.tripsGuided ?? 0} bookings
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {guide.isActive ? <Badge tone="success">Listed</Badge> : <Badge tone="warning">Paused</Badge>}
                  {guide.isVerified ? <Badge tone="info">Verified</Badge> : <Badge>Unverified</Badge>}
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
                {editingRate?.id === guide.id ? (
                  <div className="flex items-end gap-2">
                    <Input
                      label="Daily rate"
                      type="number"
                      min={0}
                      step={100}
                      value={editingRate.value}
                      onChange={(event) => setEditingRate({ id: guide.id, value: event.target.value })}
                      className="w-32"
                    />
                    <Button
                      size="sm"
                      onClick={async () => {
                        await patch(guide.id, { dailyRate: Number(editingRate.value) });
                        setEditingRate(null);
                      }}
                      disabled={updateGuide.isPending}
                    >
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingRate(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingRate({ id: guide.id, value: String(guide.dailyRate) })}
                    className="text-left"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">Daily rate</p>
                    <p className="font-bold text-foreground underline decoration-dotted">
                      {formatMoney(guide.dailyRate)}
                    </p>
                  </button>
                )}

                <div className="ml-auto flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => patch(guide.id, { isVerified: !guide.isVerified })}
                    disabled={updateGuide.isPending}
                  >
                    {guide.isVerified ? "Unverify" : "Verify"}
                  </Button>
                  <Button
                    size="sm"
                    variant={guide.isActive ? "ghost" : "primary"}
                    onClick={() => patch(guide.id, { isActive: !guide.isActive })}
                    disabled={updateGuide.isPending}
                  >
                    {guide.isActive ? "Pause listing" : "List guide"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No guides match" description="Try a different search or filter." />
      )}
    </div>
  );
}

"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useGuides } from "@/hooks/useGuides";
import { useAuth } from "@/lib/auth/AuthContext";
import { GuideCard } from "@/components/guides/GuideCard";
import { BookGuideModal } from "@/components/guides/BookGuideModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner, errorMessage } from "@/components/ui/ErrorBanner";
import { SearchIcon, SparklesIcon, StarIcon, WalletIcon } from "@/components/ui/Icons";
import type { SerializedGuide } from "@/lib/types";

const sorts = [
  { value: "rating", label: "Top rated", Icon: StarIcon },
  { value: "price", label: "Lowest rate", Icon: WalletIcon },
  { value: "experience", label: "Most experienced", Icon: SparklesIcon },
] as const;

export default function GuidesPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <GuideDirectory />
    </Suspense>
  );
}

function GuideDirectory() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const cityIdParam = searchParams?.get("cityId");
  const [search, setSearch] = useState(searchParams?.get("city") ?? "");
  const [sort, setSort] = useState<(typeof sorts)[number]["value"]>("rating");
  const [startDate, setStartDate] = useState(searchParams?.get("startDate") ?? "");
  const [endDate, setEndDate] = useState(searchParams?.get("endDate") ?? "");
  const [selected, setSelected] = useState<SerializedGuide | null>(null);

  const q = useDebouncedValue(search, 300);
  const bothDates = Boolean(startDate && endDate && endDate >= startDate);

  const { data, isLoading, error } = useGuides({
    q: q || undefined,
    cityId: cityIdParam ? Number(cityIdParam) : undefined,
    sort,
    startDate: bothDates ? startDate : undefined,
    endDate: bothDates ? endDate : undefined,
  });

  const canHire = user?.role === "USER";
  const tripIdParam = searchParams?.get("tripId");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5 rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-6">
        <div>
          <p className="text-sm font-bold text-primary">Local expertise</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground">Find a guide</h1>
          <p className="mt-1 text-sm text-muted">
            Landing somewhere you have never been? Hire someone who lives there, for exactly the days
            you need them.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto]">
          <div className="flex items-center gap-3 rounded-full border border-border bg-white px-4 py-2.5 shadow-sm focus-within:border-foreground [&>div]:flex-1">
            <SearchIcon className="h-5 w-5 text-primary" />
            <Input
              aria-label="Search guides"
              placeholder="Search a city or a guide's name"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="border-0 p-0 shadow-none focus:border-0 focus:ring-0"
            />
          </div>

          <div className="flex items-center gap-2">
            <Input
              aria-label="First day"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
            <span className="text-sm text-muted">to</span>
            <Input
              aria-label="Last day"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>

          <div className="scrollbar-hide flex gap-2 overflow-x-auto">
            {sorts.map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => setSort(value)}
                className={clsx(
                  "inline-flex min-w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors",
                  sort === value
                    ? "border-foreground bg-foreground text-white"
                    : "border-border bg-white text-muted hover:border-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {bothDates ? (
          <p className="text-sm text-muted">
            Showing only guides free from {startDate} to {endDate}.{" "}
            <button
              className="font-semibold text-primary hover:underline"
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
            >
              Clear dates
            </button>
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : error ? (
        <ErrorBanner message={errorMessage(error, "Could not load guides")} />
      ) : data && data.guides.length > 0 ? (
        <>
          <p className="-mb-4 text-sm text-muted">
            {data.total} guide{data.total === 1 ? "" : "s"} available
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {data.guides.map((guide) => (
              <GuideCard key={guide.id} guide={guide} onHire={canHire ? setSelected : undefined} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="No guides match that"
          description="Try a different city, widen your dates, or clear the filters."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setSearch("");
                setStartDate("");
                setEndDate("");
              }}
            >
              Clear filters
            </Button>
          }
        />
      )}

      <BookGuideModal
        guide={selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
        defaultTripId={tripIdParam ? Number(tripIdParam) : undefined}
        defaultStartDate={bothDates ? startDate : undefined}
        defaultEndDate={bothDates ? endDate : undefined}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useCities } from "@/hooks/useCatalogue";
import { Input } from "@/components/ui/Input";
import type { SerializedCity } from "@/lib/types";

export function CitySearchCombobox({
  value,
  onChange,
}: {
  value: SerializedCity | null;
  onChange: (city: SerializedCity) => void;
}) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 250);
  const { data, isLoading } = useCities(debouncedQuery);

  return (
    <div className="relative">
      <Input
        label="City"
        placeholder="Search a city…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && (query.length > 0 || (data?.cities.length ?? 0) > 0) ? (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-surface shadow-lg">
          {isLoading ? (
            <p className="px-3 py-2 text-sm text-muted">Searching…</p>
          ) : data && data.cities.length > 0 ? (
            data.cities.map((city) => (
              <button
                key={city.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(city);
                  setQuery(city.name);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <span>
                  {city.name}, <span className="text-muted">{city.country}</span>
                </span>
                <span className="text-xs text-muted">Cost {city.costIndex}/5</span>
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-muted">No cities found</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

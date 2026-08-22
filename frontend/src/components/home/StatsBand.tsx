"use client";

import { useQuery } from "@tanstack/react-query";
import { catalogue } from "@/lib/api/endpoints";
import { Reveal } from "@/components/home/Reveal";

/**
 * Real numbers, read from the live catalogue — the same endpoint the trip
 * builder searches. If the API is unreachable the band still renders; the two
 * counted figures just fall back to a dash rather than a made-up number.
 */
export function StatsBand() {
  const { data: cityData } = useQuery({
    queryKey: ["home-stats", "cities"],
    queryFn: () => catalogue.cities({ limit: 1 }),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { data: activityData } = useQuery({
    queryKey: ["home-stats", "activities"],
    queryFn: () => catalogue.activities({ limit: 1 }),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const count = (value: number | undefined) => (value === undefined ? "—" : `${value}+`);

  const stats = [
    { value: count(cityData?.total), label: "Cities in the catalogue" },
    { value: count(activityData?.total), label: "Curated activities" },
    { value: "Live", label: "Weather & hotel data" },
    { value: "₹0", label: "To start planning" },
  ];

  return (
    <section className="border-y border-white/10 bg-[#181818]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-8 px-4 py-12 sm:px-6 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Reveal key={stat.label} delay={index * 80}>
            <div className="text-center">
              <p className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{stat.value}</p>
              <p className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-white/55 sm:text-sm">
                {stat.label}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

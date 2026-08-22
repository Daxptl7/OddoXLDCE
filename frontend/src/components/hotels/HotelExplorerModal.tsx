"use client";

import { useState } from "react";
import { useHotels } from "@/hooks/useHotels";
import { useUpdateStop } from "@/hooks/useStops";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { FoodSuggestionsModal } from "@/components/food/FoodSuggestionsModal";
import { formatMoney } from "@/lib/format";
import { BedIcon, BuildingIcon, SearchIcon, SparklesIcon, UtensilsIcon } from "@/components/ui/Icons";
import type { Hotel } from "@/lib/types";

interface HotelExplorerModalProps {
  open: boolean;
  onClose: () => void;
  tripId: number;
  stopId: number;
  cityId: number;
  cityName: string;
  country: string;
  nights: number;
  currentAccommodationCost: number;
  currentNotes?: string | null;
}

export function HotelExplorerModal({
  open,
  onClose,
  tripId,
  stopId,
  cityId,
  cityName,
  country,
  nights,
  currentAccommodationCost,
  currentNotes,
}: HotelExplorerModalProps) {
  const [search, setSearch] = useState("");
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [selectedFoodHotel, setSelectedFoodHotel] = useState<Hotel | null>(null);
  const [appliedHotelId, setAppliedHotelId] = useState<string | null>(null);

  const { data, isLoading } = useHotels({
    cityId,
    cityName,
    country,
    q: search || undefined,
    stars: starFilter || undefined,
  });

  const updateStop = useUpdateStop(tripId);

  async function handleSelectHotel(hotel: Hotel) {
    const totalStayCost = hotel.estimatedPricePerNight * Math.max(1, nights);
    const updatedNotes = currentNotes
      ? `${currentNotes}\nHotel: ${hotel.name}`
      : `Hotel: ${hotel.name}`;

    try {
      await updateStop.mutateAsync({
        stopId,
        data: {
          accommodationCost: totalStayCost,
          notes: updatedNotes,
        },
      });
      setAppliedHotelId(hotel.id);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error("Failed to update accommodation cost", err);
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={`Hotels & Stays in ${cityName}`}
        maxWidth="max-w-4xl"
      >
        <div className="flex flex-col gap-4">
          {/* Top banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#f7f7f7] p-3.5 border border-border">
            <div className="flex items-center gap-2">
              <BuildingIcon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs font-bold text-foreground">
                  Live Overpass & OpenStreetMap Directory
                </p>
                <p className="text-[11px] text-muted">
                  Stay duration: {nights} {nights === 1 ? "night" : "nights"} in {cityName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted font-medium">Filter stars:</span>
              {[null, 3, 4, 5].map((stars) => (
                <button
                  key={stars === null ? "all" : stars}
                  type="button"
                  onClick={() => setStarFilter(stars)}
                  className={`rounded-full px-2.5 py-1 text-xs font-bold transition-all ${
                    starFilter === stars
                      ? "bg-foreground text-white shadow-sm"
                      : "bg-white text-muted border border-border hover:text-foreground"
                  }`}
                >
                  {stars === null ? "All" : `${stars}★`}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search hotel name, street address, or amenities (e.g. pool, wifi)..."
              className="w-full rounded-2xl border border-border bg-white pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Hotel list */}
          {isLoading ? (
            <div className="py-14">
              <PageSpinner />
              <p className="text-center text-xs font-medium text-muted mt-2">
                Querying Overpass API for live accommodations in {cityName}...
              </p>
            </div>
          ) : !data || data.hotels.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="text-sm font-bold text-foreground">No hotels found matching your filter.</p>
              <p className="mt-1 text-xs text-muted">Try clearing your search keyword or star filter.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[58vh] overflow-y-auto pr-1">
              <p className="text-xs text-muted font-medium">
                Found {data.total} accommodations in {cityName}
              </p>

              {data.hotels.map((hotel) => {
                const totalForStay = hotel.estimatedPricePerNight * Math.max(1, nights);
                const isSelected = appliedHotelId === hotel.id;

                return (
                  <div
                    key={hotel.id}
                    className={`flex flex-col justify-between rounded-2xl border p-4 shadow-sm transition-all ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-400"
                        : "border-border bg-white hover:border-primary/50 hover:shadow-md"
                    }`}
                  >
                    <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-foreground text-base">{hotel.name}</h4>
                          {hotel.stars ? (
                            <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                              {"★".repeat(hotel.stars)} {hotel.stars}-Star
                            </span>
                          ) : null}
                          <span className="text-[11px] text-muted font-medium">
                            📍 {hotel.distanceKm} km from center
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-muted">{hotel.address}</p>

                        {/* Amenities */}
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {hotel.amenities.map((amenity, aIdx) => (
                            <span
                              key={aIdx}
                              className="rounded-lg bg-[#f4f4f4] px-2 py-0.5 text-[10px] font-medium text-slate-700"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Pricing & action */}
                      <div className="flex flex-col items-start md:items-end justify-between gap-2 border-t md:border-t-0 border-border pt-2 md:pt-0">
                        <div className="text-left md:text-right">
                          <p className="text-base font-bold text-foreground">
                            {formatMoney(hotel.estimatedPricePerNight)}
                            <span className="text-xs font-normal text-muted"> / night</span>
                          </p>
                          <p className="text-xs font-semibold text-primary">
                            Total: {formatMoney(totalForStay)} ({nights}n)
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setSelectedFoodHotel(hotel)}
                            title="Suggest famous food & cafes near this hotel using Groq AI"
                          >
                            <UtensilsIcon className="h-3.5 w-3.5 text-primary" />
                            <span>Food Nearby</span>
                          </Button>

                          {hotel.website ? (
                            <a
                              href={hotel.website}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex items-center rounded-xl border border-border bg-white px-2.5 py-1.5 text-xs font-bold text-muted hover:text-foreground hover:bg-[#f7f7f7] transition-colors"
                            >
                              Website ↗
                            </a>
                          ) : null}

                          <Button
                            size="sm"
                            variant={isSelected ? "secondary" : "primary"}
                            onClick={() => handleSelectHotel(hotel)}
                            disabled={updateStop.isPending}
                          >
                            <BedIcon className="h-3.5 w-3.5" />
                            {isSelected ? "Selected ✓" : "Set as Stay"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end border-t border-border pt-3">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {selectedFoodHotel ? (
        <FoodSuggestionsModal
          open={Boolean(selectedFoodHotel)}
          onClose={() => setSelectedFoodHotel(null)}
          cityName={cityName}
          country={country}
          hotelName={selectedFoodHotel.name}
          hotelAddress={selectedFoodHotel.address}
          tripId={tripId}
          stopId={stopId}
        />
      ) : null}
    </>
  );
}

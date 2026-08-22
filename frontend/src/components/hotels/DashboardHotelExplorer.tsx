"use client";

import { useState } from "react";
import { useHotels } from "@/hooks/useHotels";
import { WeatherWidget } from "@/components/weather/WeatherWidget";
import { FoodSuggestionsModal } from "@/components/food/FoodSuggestionsModal";
import { Button } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatMoney } from "@/lib/format";
import {
  BedIcon,
  BuildingIcon,
  MapPinIcon,
  SearchIcon,
  UtensilsIcon,
} from "@/components/ui/Icons";
import type { Hotel } from "@/lib/types";

const POPULAR_DESTINATIONS = [
  { id: 1, name: "Paris", country: "France" },
  { id: 2, name: "Rome", country: "Italy" },
  { id: 3, name: "Tokyo", country: "Japan" },
  { id: 4, name: "Bali", country: "Indonesia" },
  { id: 5, name: "New York", country: "United States" },
  { id: 6, name: "Barcelona", country: "Spain" },
  { id: 7, name: "London", country: "United Kingdom" },
  { id: 8, name: "Bangkok", country: "Thailand" },
  { id: 9, name: "Istanbul", country: "Turkey" },
  { id: 10, name: "Dubai", country: "United Arab Emirates" },
  { id: 11, name: "Singapore", country: "Singapore" },
  { id: 12, name: "Amsterdam", country: "Netherlands" },
];

const ITEMS_PER_PAGE = 6;

export function DashboardHotelExplorer() {
  const [selectedCity, setSelectedCity] = useState(POPULAR_DESTINATIONS[0]!);
  const [customCitySearch, setCustomCitySearch] = useState("");
  const [hotelSearch, setHotelSearch] = useState("");
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFoodHotel, setSelectedFoodHotel] = useState<Hotel | null>(null);

  const { data, isLoading } = useHotels({
    cityId: selectedCity.id,
    cityName: selectedCity.name,
    country: selectedCity.country,
    q: hotelSearch || undefined,
    stars: starFilter || undefined,
    limit: 50,
  });

  const allHotels = data?.hotels ?? [];
  const totalItems = allHotels.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentHotels = allHotels.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  function handleCityChange(city: typeof selectedCity) {
    setSelectedCity(city);
    setCurrentPage(1);
  }

  function handleCustomCitySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customCitySearch.trim()) return;
    setSelectedCity({
      id: 0,
      name: customCitySearch.trim(),
      country: "",
    });
    setCustomCitySearch("");
    setCurrentPage(1);
  }

  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-7">
      {/* Title & header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-50 text-primary">
              <BuildingIcon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                Explore Live Hotels & Stays
              </h2>
              <p className="text-xs text-muted sm:text-sm">
                Real-time booking rates and accommodations powered by Booking.com & OpenStreetMap
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedCity.id > 0 ? (
            <WeatherWidget
              cityId={selectedCity.id}
              cityName={selectedCity.name}
            />
          ) : null}
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
            ● Booking API Active
          </span>
        </div>
      </div>

      {/* City selector pills & search */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Popular Destinations:
          </p>

          <form onSubmit={handleCustomCitySubmit} className="flex items-center gap-1.5">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
              <input
                type="text"
                value={customCitySearch}
                onChange={(e) => setCustomCitySearch(e.target.value)}
                placeholder="Search any Indian or global city..."
                className="rounded-full border border-border bg-[#f7f7f7] pl-8 pr-3 py-1 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              className="rounded-full bg-foreground text-white px-3 py-1 text-xs font-bold hover:bg-black transition-colors"
            >
              Search City
            </button>
          </form>
        </div>

        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
          {POPULAR_DESTINATIONS.map((city) => {
            const isSelected = selectedCity.name.toLowerCase() === city.name.toLowerCase();
            return (
              <button
                key={city.name}
                type="button"
                onClick={() => handleCityChange(city)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-primary text-white shadow-sm ring-2 ring-primary/20"
                    : "border border-border bg-[#f9f9f9] text-muted hover:border-foreground hover:text-foreground hover:bg-white"
                }`}
              >
                <MapPinIcon className="h-3 w-3" />
                {city.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#fafafa] p-3 border border-border/80">
        <div className="relative min-w-[240px] flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
          <input
            type="text"
            value={hotelSearch}
            onChange={(e) => {
              setHotelSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={`Search hotels, address, amenities in ${selectedCity.name}...`}
            className="w-full rounded-xl border border-border bg-white pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-muted">Stars:</span>
          {[null, 3, 4, 5].map((stars) => (
            <button
              key={stars === null ? "all" : stars}
              type="button"
              onClick={() => {
                setStarFilter(stars);
                setCurrentPage(1);
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
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

      {/* Hotel Cards Grid with Pagination */}
      {isLoading ? (
        <div className="py-16">
          <PageSpinner />
          <p className="mt-3 text-center text-xs font-medium text-muted">
            Fetching real-time hotel listings for {selectedCity.name}...
          </p>
        </div>
      ) : currentHotels.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-[#fafafa]">
          <p className="text-base font-bold text-foreground">No hotel listings found for {selectedCity.name}</p>
          <p className="mt-1.5 text-xs text-muted max-w-md mx-auto leading-relaxed">
            There are currently no active hotel or accommodation listings returned from the live API for this place. Please choose another destination from the quick switcher or search a different city.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-muted">
            <p>
              Showing <span className="font-bold text-foreground">{startIndex + 1}</span>–
              <span className="font-bold text-foreground">
                {Math.min(startIndex + ITEMS_PER_PAGE, totalItems)}
              </span>{" "}
              of <span className="font-bold text-foreground">{totalItems}</span> hotels in{" "}
              <span className="font-bold text-foreground">{selectedCity.name}</span>
            </p>
            <p className="text-[11px]">Page {currentPage} of {totalPages}</p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {currentHotels.map((hotel) => (
              <div
                key={hotel.id}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-white shadow-sm transition-all hover:border-primary/50 hover:shadow-xl"
              >
                <div>
                  {/* Hotel Photo Banner */}
                  <div
                    className="relative h-44 w-full bg-slate-100 bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.02]"
                    style={{
                      backgroundImage: `url(${hotel.photoUrl || `https://picsum.photos/seed/${encodeURIComponent(hotel.name)}/800/600`})`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Rating badge */}
                    <div className="absolute left-3 top-3 flex items-center gap-1.5">
                      {hotel.rating ? (
                        <span className="rounded-full bg-primary/95 px-2.5 py-0.5 text-xs font-bold text-white shadow-md backdrop-blur">
                          ⭐ {hotel.rating} / 10
                        </span>
                      ) : hotel.stars ? (
                        <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-black shadow-md">
                          {"★".repeat(hotel.stars)}
                        </span>
                      ) : null}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <p className="text-[11px] font-semibold text-white/90 truncate">
                        📍 {hotel.distanceKm} km from center
                      </p>
                    </div>
                  </div>

                  {/* Hotel Details */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-foreground leading-tight line-clamp-1">
                        {hotel.name}
                      </h3>
                    </div>

                    <p className="mt-1 text-xs text-muted line-clamp-2 leading-relaxed">
                      {hotel.address}
                    </p>

                    {/* Amenities tags */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {hotel.amenities.slice(0, 3).map((amenity, aIdx) => (
                        <span
                          key={aIdx}
                          className="rounded-lg bg-[#f4f4f4] px-2 py-0.5 text-[10px] font-medium text-slate-700"
                        >
                          {amenity}
                        </span>
                      ))}
                      {hotel.amenities.length > 3 ? (
                        <span className="rounded-lg bg-[#f4f4f4] px-2 py-0.5 text-[10px] font-medium text-muted">
                          +{hotel.amenities.length - 3} more
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Pricing and Book Now action button */}
                <div className="border-t border-border/70 bg-[#fafafa] p-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-xs text-muted font-medium">Starting from</p>
                      <p className="text-lg font-extrabold text-foreground">
                        {formatMoney(hotel.estimatedPricePerNight)}
                        <span className="text-xs font-normal text-muted"> / night</span>
                      </p>
                    </div>

                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Free Cancellation
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {/* Food suggestions button */}
                    <button
                      type="button"
                      onClick={() => setSelectedFoodHotel(hotel)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-white px-3 py-2 text-xs font-bold text-foreground hover:bg-[#f7f7f7] transition-all"
                      title="Explore top delicacies & cafes near this hotel using Groq AI"
                    >
                      <UtensilsIcon className="h-3.5 w-3.5 text-orange-500" />
                      <span>Food Nearby</span>
                    </button>

                    {/* Working Direct Book Now button */}
                    <a
                      href={hotel.bookingUrl || hotel.website || `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotel.name + ' ' + selectedCity.name)}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center justify-center gap-1 rounded-2xl bg-primary px-3 py-2 text-xs font-bold text-white shadow-md hover:bg-primary/90 transition-all text-center"
                    >
                      <span>Book Now</span>
                      <span>↗</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 ? (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                ← Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-8 w-8 rounded-xl text-xs font-bold transition-colors ${
                          currentPage === pageNum
                            ? "bg-foreground text-white shadow-sm"
                            : "bg-[#f7f7f7] text-muted hover:bg-border hover:text-foreground"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return (
                      <span key={pageNum} className="text-xs text-muted px-1">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next →
              </Button>
            </div>
          ) : null}
        </>
      )}

      {selectedFoodHotel ? (
        <FoodSuggestionsModal
          open={Boolean(selectedFoodHotel)}
          onClose={() => setSelectedFoodHotel(null)}
          cityName={selectedCity.name}
          country={selectedCity.country}
          hotelName={selectedFoodHotel.name}
          hotelAddress={selectedFoodHotel.address}
        />
      ) : null}
    </section>
  );
}

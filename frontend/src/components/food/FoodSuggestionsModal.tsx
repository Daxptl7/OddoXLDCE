"use client";

import { useState } from "react";
import { useFoodSuggestions } from "@/hooks/useFoodSuggestions";
import { useAddStopActivity } from "@/hooks/useStops";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatMoney } from "@/lib/format";
import { PlusIcon, SparklesIcon, UtensilsIcon } from "@/components/ui/Icons";
import type { FoodItem } from "@/lib/types";

interface FoodSuggestionsModalProps {
  open: boolean;
  onClose: () => void;
  cityName: string;
  country: string;
  hotelName?: string | null;
  hotelAddress?: string | null;
  tripId?: number;
  stopId?: number;
}

const categoryTones: Record<FoodItem["category"], "info" | "success" | "warning"> = {
  must_try: "info",
  street_food: "warning",
  sweet_dessert: "info",
  beverage: "info",
  classic: "success",
};

export function FoodSuggestionsModal({
  open,
  onClose,
  cityName,
  country,
  hotelName,
  hotelAddress,
  tripId,
  stopId,
}: FoodSuggestionsModalProps) {
  const [dietary, setDietary] = useState<string>("all");
  const [addedDishes, setAddedDishes] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useFoodSuggestions(
    {
      cityName,
      country,
      hotelName,
      hotelAddress,
      dietaryPreference: dietary,
    },
    open,
  );

  const addActivity = tripId ? useAddStopActivity(tripId) : null;

  async function handleAddFoodAsActivity(dish: FoodItem) {
    if (!addActivity || !stopId) return;
    try {
      // Note: for catalogue activities, in GlobeTrotter activities are reference catalogue items.
      // We can attach or note custom activities.
      setAddedDishes((prev) => ({ ...prev, [dish.dish]: true }));
    } catch (err) {
      console.error("Failed to add food activity", err);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={hotelName ? `Food & Cafes near ${hotelName}` : `Best & Favorite Food in ${cityName}`}
      maxWidth="max-w-3xl"
    >
      <div className="flex flex-col gap-4">
        {/* Header context */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-gradient-to-r from-rose-50 via-orange-50 to-amber-50 p-4 border border-rose-100">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
              <SparklesIcon className="h-4 w-4" />
              <span>AI Culinary Guide · Groq</span>
              {data?.source === "groq" ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Live Groq AI
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-foreground/80 leading-relaxed max-w-xl">
              {data?.cuisineOverview || `Authentic dishes and top dining spots curated for ${cityName}.`}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {["all", "vegetarian", "street_food"].map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setDietary(style)}
                className={`rounded-full px-3 py-1 text-xs font-bold capitalize transition-all ${
                  dietary === style
                    ? "bg-foreground text-white shadow-sm"
                    : "bg-white/80 text-muted hover:bg-white hover:text-foreground"
                }`}
              >
                {style.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-12">
            <PageSpinner />
            <p className="text-center text-xs font-medium text-muted mt-2">
              Asking Groq AI for local delicacies and favorite foodie spots...
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {data?.foods.map((food, idx) => (
              <div
                key={`${food.dish}-${idx}`}
                className="flex flex-col justify-between rounded-2xl border border-border bg-white p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-foreground text-base">{food.dish}</h4>
                      {food.localName && food.localName !== food.dish ? (
                        <span className="text-xs font-medium italic text-muted">({food.localName})</span>
                      ) : null}
                      <Badge tone={categoryTones[food.category] || "brand"}>
                        {food.category.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted leading-relaxed">{food.description}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">
                      ~{formatMoney(food.estimatedCost)}
                    </p>
                    <p className="text-[10px] text-muted">est. price</p>
                  </div>
                </div>

                {food.whySpecial ? (
                  <p className="mt-2.5 text-xs text-foreground/90 bg-[#fafafa] rounded-xl px-3 py-1.5 border border-border/50">
                    <span className="font-semibold text-primary">✨ Why Special:</span> {food.whySpecial}
                  </p>
                ) : null}

                {food.foodieTip ? (
                  <p className="mt-1.5 text-xs text-amber-900 bg-amber-50/60 rounded-xl px-3 py-1.5 border border-amber-200/50">
                    <span className="font-semibold">💡 Local Tip:</span> {food.foodieTip}
                  </p>
                ) : null}

                {/* Best places near hotel */}
                {food.bestPlacesNearHotel && food.bestPlacesNearHotel.length > 0 ? (
                  <div className="mt-3 border-t border-border/60 pt-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                      <UtensilsIcon className="h-3 w-3 text-primary" />
                      Recommended spots near {hotelName ? "hotel" : "stay"}:
                    </p>
                    <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                      {food.bestPlacesNearHotel.map((place, pIdx) => (
                        <div
                          key={pIdx}
                          className="rounded-xl border border-border/80 bg-[#fbfbfb] p-2.5 text-xs flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-foreground truncate">{place.name}</span>
                              {place.priceLevel ? (
                                <span className="text-[10px] font-bold text-muted">{place.priceLevel}</span>
                              ) : null}
                            </div>
                            <p className="text-[11px] text-muted line-clamp-1 mt-0.5">{place.description}</p>
                          </div>
                          {place.approxDistance ? (
                            <span className="mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 rounded-md px-1.5 py-0.5 self-start">
                              📍 {place.approxDistance}
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end border-t border-border pt-3">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}

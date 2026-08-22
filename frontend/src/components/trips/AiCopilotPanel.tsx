"use client";

import { useMemo, useState } from "react";
import { useAiOptimize, useAiPlan, useAiRecommendations } from "@/hooks/useAi";
import { useAddStopActivity, useRemoveStopActivity } from "@/hooks/useStops";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ErrorBanner, errorMessage } from "@/components/ui/ErrorBanner";
import { formatMoney } from "@/lib/format";
import type { SerializedTrip, TripBudget } from "@/lib/types";
import { PlusIcon, SparklesIcon, TrashIcon, WalletIcon } from "@/components/ui/Icons";

export function AiCopilotPanel({ trip, budget }: { trip: SerializedTrip; budget?: TripBudget }) {
  const [destinations, setDestinations] = useState(() => trip.stops?.map((stop) => stop.city?.name).filter(Boolean).join(", ") ?? "");
  const [interests, setInterests] = useState("food, culture");
  const [targetBudget, setTargetBudget] = useState(String(trip.targetBudget ?? budget?.target.budget ?? ""));
  const [message, setMessage] = useState<string | null>(null);

  const aiPlan = useAiPlan();
  const aiRecommendations = useAiRecommendations();
  const aiOptimize = useAiOptimize();
  const addActivity = useAddStopActivity(trip.id);
  const removeActivity = useRemoveStopActivity(trip.id);

  const durationDays = useMemo(() => {
    if (!trip.startDate || !trip.endDate) return 7;
    const start = new Date(`${trip.startDate}T00:00:00`);
    const end = new Date(`${trip.endDate}T00:00:00`);
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);
  }, [trip.endDate, trip.startDate]);

  async function generatePlan() {
    setMessage(null);
    await aiPlan.mutateAsync({
      destinations: destinations || trip.name,
      durationDays,
      budget: targetBudget ? Number(targetBudget) : undefined,
      interests: interests.split(",").map((item) => item.trim()).filter(Boolean),
      travelStyle: "balanced",
    });
  }

  async function recommend() {
    setMessage(null);
    await aiRecommendations.mutateAsync({ tripId: trip.id });
  }

  async function optimize() {
    setMessage(null);
    await aiOptimize.mutateAsync({ tripId: trip.id, targetBudget: Number(targetBudget || 0) });
  }

  async function addSuggestedActivity(stopId: number, activityId: number) {
    await addActivity.mutateAsync({ stopId, data: { activityId } });
    setMessage("Activity added. Budget and itinerary recalculated.");
  }

  async function removeSuggestedActivity(stopActivityId: number) {
    await removeActivity.mutateAsync(stopActivityId);
    setMessage("Activity removed. Budget and itinerary recalculated.");
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 text-primary">
            <SparklesIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-foreground">AI planning assistant</h2>
            <p className="mt-1 text-sm text-muted">Calls the LLM with real catalogue candidates, then validates every city and activity ID.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <Input label="Destinations" value={destinations} onChange={(event) => setDestinations(event.target.value)} />
          <Input label="Interests" value={interests} onChange={(event) => setInterests(event.target.value)} />
          <Input
            label="Target budget"
            type="number"
            min="0"
            value={targetBudget}
            onChange={(event) => setTargetBudget(event.target.value)}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={generatePlan} disabled={aiPlan.isPending}>
            <SparklesIcon className="h-4 w-4" />
            Preview plan
          </Button>
          <Button size="sm" variant="secondary" onClick={recommend} disabled={aiRecommendations.isPending}>
            <PlusIcon className="h-4 w-4" />
            Recommend activities
          </Button>
          <Button size="sm" variant="secondary" onClick={optimize} disabled={aiOptimize.isPending || !targetBudget}>
            <WalletIcon className="h-4 w-4" />
            Optimize budget
          </Button>
        </div>

        {message ? <p className="mt-4 rounded-xl bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800">{message}</p> : null}
        {aiPlan.error ? <ErrorBanner message={errorMessage(aiPlan.error, "Could not preview a plan")} /> : null}
        {aiRecommendations.error ? <ErrorBanner message={errorMessage(aiRecommendations.error, "Could not recommend activities")} /> : null}
        {aiOptimize.error ? <ErrorBanner message={errorMessage(aiOptimize.error, "Could not optimize this trip")} /> : null}
      </Card>

      <div className="flex flex-col gap-4">
        {aiPlan.data ? (
          <Card className="p-5">
            <p className="text-xs font-bold uppercase text-primary">Planner preview</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-foreground">{aiPlan.data.title}</h3>
              <span className="rounded-full bg-[#f7f7f7] px-2.5 py-1 text-xs font-bold text-muted">
                {aiPlan.data.source === "groq" ? "Groq generated" : "Fallback"}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">{aiPlan.data.summary}</p>
            <div className="mt-4 flex flex-col gap-3">
              {aiPlan.data.stops.map((stop) => (
                <div key={stop.city.id} className="rounded-2xl border border-border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-foreground">{stop.city.name}, {stop.city.country}</p>
                    <span className="text-sm font-bold text-muted">{formatMoney(stop.estimatedCost)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{stop.suggestedDays} days · {stop.activities.map((activity) => activity.name).join(", ")}</p>
                  {stop.reason ? <p className="mt-2 text-xs text-muted">{stop.reason}</p> : null}
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {aiRecommendations.data ? (
          <Card className="p-5">
            <p className="text-xs font-bold uppercase text-primary">Activity recommendations</p>
            <div className="mt-3 flex flex-col gap-4">
              {aiRecommendations.data.recommendations.map((group) => (
                <div key={group.stopId}>
                  <p className="font-bold text-foreground">{group.city}</p>
                  <p className="text-xs text-muted">{group.reason}</p>
                  <div className="mt-2 flex flex-col gap-2">
                    {group.activities.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#f7f7f7] px-3 py-2">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-foreground">{activity.name}</span>
                          <span className="text-xs text-muted">{activity.category} · {formatMoney(activity.estimatedCost ?? 0)}</span>
                        </span>
                        <Button size="sm" variant="secondary" onClick={() => addSuggestedActivity(group.stopId, activity.id)} disabled={addActivity.isPending}>
                          <PlusIcon className="h-4 w-4" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {aiOptimize.data ? (
          <Card className="p-5">
            <p className="text-xs font-bold uppercase text-primary">Budget optimization preview</p>
            <h3 className="mt-1 text-lg font-bold text-foreground">
              {formatMoney(aiOptimize.data.currentTotal)} to {formatMoney(aiOptimize.data.targetBudget)}
            </h3>
            <p className="mt-1 text-sm text-muted">{aiOptimize.data.reason}</p>
            <div className="mt-3 flex flex-col gap-2">
              {aiOptimize.data.actions.map((action) => (
                <div key={action.stopActivityId} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
                  <span>
                    <span className="block text-sm font-semibold text-foreground">{action.label}</span>
                    <span className="text-xs text-muted">Save {formatMoney(action.savings)}</span>
                  </span>
                  <Button size="sm" variant="danger" onClick={() => removeSuggestedActivity(action.stopActivityId)} disabled={removeActivity.isPending}>
                    <TrashIcon className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

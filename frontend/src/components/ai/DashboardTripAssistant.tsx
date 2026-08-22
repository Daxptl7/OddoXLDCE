"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { useAiSchedule } from "@/hooks/useAi";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { SparklesIcon } from "@/components/ui/Icons";
import type { SerializedTrip } from "@/lib/types";

type AssistantMessage = {
  role: "user" | "assistant";
  text: string;
  tripId?: number;
};

export function DashboardTripAssistant({
  recentTrips,
  upcomingTrips,
}: {
  recentTrips: SerializedTrip[];
  upcomingTrips: SerializedTrip[];
}) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [tripId, setTripId] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      text: "Tell me where, when, budget, and travel style. I can schedule a trip from your prompt.",
    },
  ]);
  const queryClient = useQueryClient();
  const schedule = useAiSchedule();

  const trips = useMemo(() => {
    const seen = new Set<number>();
    return [...upcomingTrips, ...recentTrips].filter((trip) => {
      if (seen.has(trip.id)) return false;
      seen.add(trip.id);
      return true;
    });
  }, [recentTrips, upcomingTrips]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const text = prompt.trim();
    if (!text || schedule.isPending) return;

    setPrompt("");
    setMessages((items) => [...items, { role: "user", text }]);

    try {
      const response = await schedule.mutateAsync({
        prompt: text,
        tripId: tripId ? Number(tripId) : undefined,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["trips"] }),
      ]);

      setMessages((items) => [
        ...items,
        {
          role: "assistant",
          text: response.note ? `${response.message} ${response.note}` : response.message,
          tripId: response.trip.id,
        },
      ]);
      setTripId("");
    } catch (error) {
      setMessages((items) => [
        ...items,
        {
          role: "assistant",
          text:
            error instanceof Error
              ? error.message
              : "I could not schedule that trip. Check that the backend is running and Groq is configured.",
        },
      ]);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open ? (
        <div className="w-[min(calc(100vw-2.5rem),390px)] overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-5 w-5" />
              <p className="text-sm font-bold">Trip assistant</p>
            </div>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold hover:bg-white/15"
              onClick={() => setOpen(false)}
              aria-label="Close trip assistant"
            >
              x
            </button>
          </div>

          <div className="flex max-h-80 flex-col gap-2 overflow-y-auto bg-[#fff7f9] p-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={clsx(
                  "max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  message.role === "user"
                    ? "self-end bg-primary text-white"
                    : "self-start border border-rose-100 bg-white text-foreground",
                )}
              >
                <p>{message.text}</p>
                {message.tripId ? (
                  <Link
                    href={`/trips/${message.tripId}`}
                    className="mt-2 inline-flex rounded-full bg-primary px-3 py-1 text-xs font-bold text-white hover:bg-[#e31c5f]"
                  >
                    Open trip
                  </Link>
                ) : null}
              </div>
            ))}
            {schedule.isPending ? (
              <p className="self-start rounded-2xl border border-rose-100 bg-white px-3 py-2 text-sm text-muted">
                Scheduling...
              </p>
            ) : null}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-2 border-t border-rose-100 bg-white p-3">
            <select
              value={tripId}
              onChange={(event) => setTripId(event.target.value)}
              className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-foreground focus:ring-1 focus:ring-foreground"
            >
              <option value="">Create new trip</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  Update {trip.name}
                </option>
              ))}
            </select>
            <Textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={3}
              placeholder="Plan Jaipur and Udaipur for 5 days next month under 45000"
              className="resize-none"
            />
            <Button type="submit" size="sm" disabled={schedule.isPending || !prompt.trim()}>
              Schedule trip
            </Button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-2xl transition-transform hover:scale-105 hover:bg-[#e31c5f]"
        aria-label="Open trip assistant"
      >
        <SparklesIcon className="h-7 w-7" />
      </button>
    </div>
  );
}

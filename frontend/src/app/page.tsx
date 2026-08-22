import Link from "next/link";
import { PublicNavbar } from "@/components/home/PublicNavbar";
import { HeroScroller } from "@/components/home/HeroScroller";
import { WorkflowSection } from "@/components/home/WorkflowSection";

const avatars = ["🧑‍🌾", "🧑‍🌾", "🧑‍🌾", "🧑‍🌾"];

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <PublicNavbar />

      <section className="relative flex h-screen min-h-[640px] w-full items-center overflow-hidden">
        <HeroScroller />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
          <h1 className="max-w-2xl text-4xl font-bold leading-tight text-white sm:text-6xl">
            Plan Multi-City Trips, Effortlessly
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/90">
            Build a day-by-day itinerary across every city on your trip, attach activities, and watch the budget
            derive itself as you go.
          </p>
          <div className="mt-8 flex items-center gap-6 text-white">
            <Link
              href="/signup"
              className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-white/90"
            >
              Get Started
            </Link>
            <Link href="/login" className="text-sm font-medium underline-offset-4 hover:underline">
              Login
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-6 z-10 flex items-center gap-3 text-white sm:left-10">
          <div className="flex -space-x-2">
            {avatars.map((emoji, index) => (
              <span
                key={index}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/40 bg-slate-700 text-sm"
              >
                {emoji}
              </span>
            ))}
          </div>
          <div className="text-sm">
            <p className="font-medium">Over 2,500 travelers have trusted us</p>
            <p className="text-white/80">⭐ 4.9</p>
          </div>
        </div>
      </section>

      <WorkflowSection />
    </div>
  );
}

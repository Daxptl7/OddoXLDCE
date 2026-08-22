import Link from "next/link";
import { PublicNavbar } from "@/components/home/PublicNavbar";
import { HeroScroller } from "@/components/home/HeroScroller";
import { WorkflowSection } from "@/components/home/WorkflowSection";
import { PublicSiteChatbot } from "@/components/ai/PublicSiteChatbot";
import { SparklesIcon, CompassIcon } from "@/components/ui/Icons";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <PublicNavbar />

      <section className="relative flex min-h-[90svh] w-full items-center justify-center overflow-hidden pb-20 pt-28 sm:min-h-screen">
        <HeroScroller />

        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-4 text-center sm:px-6">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md">
            <SparklesIcon className="h-4 w-4 text-rose-300" />
            AI-Powered Travel Planning
          </span>

          <h1 className="text-5xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-7xl lg:text-8xl">
            GoVenture
          </h1>

          <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-white/95 drop-shadow sm:text-2xl">
            Smart Itineraries. Authentic Adventures. Real-Time Budgets.
          </p>

          <p className="mt-3 max-w-xl text-sm text-white/80 drop-shadow sm:text-base">
            Plan multi-city journeys, discover curated activities, and keep every rupee of your trip effortlessly balanced.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-white">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-bold text-white shadow-xl transition-all hover:bg-[#e31c5f] hover:shadow-2xl hover:scale-105 active:scale-95"
            >
              <CompassIcon className="h-5 w-5" />
              Start Planning Free
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/30 bg-white/15 px-7 py-4 text-base font-bold text-white backdrop-blur-md transition-all hover:bg-white/25"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <WorkflowSection />
      <PublicSiteChatbot />
    </div>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import { PublicNavbar } from "@/components/home/PublicNavbar";
import { HeroScroller } from "@/components/home/HeroScroller";
import { WorkflowSection } from "@/components/home/WorkflowSection";
import { PublicSiteChatbot } from "@/components/ai/PublicSiteChatbot";
import {
  CalendarIcon,
  MapPinIcon,
  SearchIcon,
  UsersIcon,
} from "@/components/ui/Icons";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <PublicNavbar />

      <section className="relative flex min-h-[calc(100svh-72px)] w-full items-center overflow-hidden pb-20 pt-28">
        <HeroScroller />

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-4 text-center sm:px-6">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl">
            GoVenture
          </h1>

          <div className="mt-10 w-full max-w-4xl rounded-full bg-white p-2 shadow-2xl max-md:rounded-3xl">
            <div className="grid grid-cols-1 items-center divide-y divide-border md:grid-cols-[1.3fr_1fr_1fr_auto] md:divide-x md:divide-y-0">
              <SearchCell icon={<MapPinIcon className="h-5 w-5" />} label="Where" value="Search destinations" />
              <SearchCell icon={<CalendarIcon className="h-5 w-5" />} label="When" value="Add dates" />
              <SearchCell icon={<UsersIcon className="h-5 w-5" />} label="Who" value="Travel style" />
              <Link
                href="/signup"
                className="m-1 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-[#e31c5f] md:h-14"
              >
                <SearchIcon className="h-5 w-5" />
                Start
              </Link>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-5 text-white">
            <Link href="/signup" className="rounded-full bg-white px-6 py-3 text-sm font-bold text-[#222222] transition-colors hover:bg-white/90 shadow-md">
              Get started
            </Link>
            <Link href="/login" className="text-sm font-bold underline-offset-4 hover:underline">
              Login
            </Link>
          </div>
        </div>
      </section>

      <WorkflowSection />
      <PublicSiteChatbot />
    </div>
  );
}

function SearchCell({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Link href="/signup" className="flex min-h-16 items-center gap-3 rounded-full px-5 py-3 text-left hover:bg-[#f7f7f7] max-md:rounded-2xl">
      <span className="text-primary">{icon}</span>
      <span>
        <span className="block text-xs font-bold text-[#222222]">{label}</span>
        <span className="block text-sm text-muted">{value}</span>
      </span>
    </Link>
  );
}

import Link from "next/link";
import { Reveal } from "@/components/home/Reveal";
import { ArrowRightIcon, CompassIcon } from "@/components/ui/Icons";

export function CtaSection() {
  return (
    <section className="bg-background pb-20 lg:pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#ff385c] via-[#e31c5f] to-[#8b1538] px-6 py-16 text-center sm:px-12 sm:py-20">
            {/* Soft light blooms, drawn with gradients so there is no image to load. */}
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                Where are you going next?
              </h2>
              <p className="mt-5 text-base leading-relaxed text-white/85 sm:text-lg">
                Start with one city and a rough set of dates. The itinerary, the budget and the
                guide can all come after — that is rather the point.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-[#c2185b] shadow-xl transition-all hover:scale-105 active:scale-95"
                >
                  <CompassIcon className="h-5 w-5" />
                  Start planning free
                </Link>
                <Link
                  href="/guides"
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-7 py-4 text-base font-bold text-white backdrop-blur transition-all hover:gap-3 hover:bg-white/20"
                >
                  Meet the guides
                  <ArrowRightIcon className="h-5 w-5" />
                </Link>
              </div>
              <p className="mt-6 text-sm text-white/70">
                Free to plan · No card needed · Your trips stay private
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

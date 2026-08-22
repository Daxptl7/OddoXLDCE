import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/home/Reveal";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  CalendarIcon,
  MapPinIcon,
  PhoneIcon,
  StarIcon,
  WalletIcon,
} from "@/components/ui/Icons";

const travellerPoints = [
  { Icon: MapPinIcon, text: "Filter guides by the city you are landing in" },
  { Icon: CalendarIcon, text: "See only who is free across your exact dates" },
  { Icon: PhoneIcon, text: "Get their number the moment they accept" },
  { Icon: StarIcon, text: "Ratings, languages and years guiding up front" },
];

const guidePoints = [
  { Icon: WalletIcon, text: "Set your own daily rate and change it any time" },
  { Icon: CalendarIcon, text: "Accept or decline each booking — your calendar, your call" },
  { Icon: BadgeCheckIcon, text: "A verified badge once our team has checked you out" },
  { Icon: MapPinIcon, text: "Pause your listing the week you are away, with one click" },
];

export function GuidesSection() {
  return (
    <section id="guides" className="relative overflow-hidden bg-[#141414]">
      <div className="absolute inset-0 opacity-20">
        <Image
          src="/Hot-Air-Balloon-Flights_Cappadocia_Adventure_Balloon-Safety_Travel-Atelier-Luxury-DMC_Balloon-Tour-1.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#141414] via-[#141414]/85 to-[#141414]" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <Reveal>
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wider text-rose-400">Local guides</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Somebody who actually lives there
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/70 sm:text-lg">
              You have three days in a city you have never seen. You can spend the first one getting
              lost, or you can spend it with a guide who knows which queue to skip, which street is
              worth the detour, and where to eat at 11pm. Hire them by the day — no packages, no
              tour bus.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="flex h-full flex-col rounded-3xl border border-white/15 bg-white/[0.06] p-7 backdrop-blur-sm sm:p-9">
              <p className="text-xs font-bold uppercase tracking-wider text-rose-300">For travellers</p>
              <h3 className="mt-2 text-2xl font-bold text-white">Hire a guide for the days you need</h3>
              <ul className="mt-6 flex flex-col gap-3.5">
                {travellerPoints.map(({ Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-sm text-white/80">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-rose-300">
                      <Icon className="h-4 w-4" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
              <Link
                href="/guides"
                className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:gap-3 hover:bg-[#e31c5f]"
              >
                Browse guides
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="flex h-full flex-col rounded-3xl border border-white/15 bg-white/[0.06] p-7 backdrop-blur-sm sm:p-9">
              <p className="text-xs font-bold uppercase tracking-wider text-rose-300">
                We&apos;re hiring guides
              </p>
              <h3 className="mt-2 text-2xl font-bold text-white">Know your city? Get paid for it</h3>
              <ul className="mt-6 flex flex-col gap-3.5">
                {guidePoints.map(({ Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-sm text-white/80">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-rose-300">
                      <Icon className="h-4 w-4" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white transition-all hover:gap-3 hover:bg-white/20"
              >
                Apply as a guide
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <p className="mt-4 text-xs text-white/50">
                Pick &ldquo;I&apos;m a guide&rdquo; on the signup form — it takes about two minutes.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

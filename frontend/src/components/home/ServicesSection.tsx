import Link from "next/link";
import { Reveal } from "@/components/home/Reveal";
import {
  ArrowRightIcon,
  BedIcon,
  ChartIcon,
  CompassIcon,
  ShareIcon,
  SparklesIcon,
  SunIcon,
  UsersIcon,
  UtensilsIcon,
} from "@/components/ui/Icons";

const services = [
  {
    Icon: CompassIcon,
    title: "Multi-city itinerary builder",
    description:
      "Chain as many cities as a trip needs. Drag to reorder and every stay re-chains back-to-back from your start date, so the order and the dates can never disagree.",
    tag: "Core",
  },
  {
    Icon: ChartIcon,
    title: "A budget that derives itself",
    description:
      "Transport, stays and activities roll up per stop, per category and per day. Set a target and the health bar tells you where you actually stand.",
    tag: "Core",
  },
  {
    Icon: UsersIcon,
    title: "Local guides, by the day",
    description:
      "Browse verified guides in the city you are landing in, filter to who is free on your dates, and book them for the exact days you need.",
    tag: "Guides",
  },
  {
    Icon: SparklesIcon,
    title: "AI trip assistant",
    description:
      "Describe the trip you want and get a draft schedule back. Ask it to rebalance a day, suggest what to add, or trim the plan to fit a budget.",
    tag: "AI",
  },
  {
    Icon: SunIcon,
    title: "Weather on every stop",
    description:
      "Forecasts sit right on the itinerary, and a washout on a day you planned something outdoors comes back as a warning, not a surprise.",
    tag: "Live data",
  },
  {
    Icon: BedIcon,
    title: "Hotel discovery",
    description:
      "Search real accommodation around each stop from open map data, then push the nightly cost straight into that stay's budget line.",
    tag: "Live data",
  },
  {
    Icon: UtensilsIcon,
    title: "Food & local delicacies",
    description:
      "The dishes a city is actually known for and where to eat them, generated per stop and attachable to a day in one tap.",
    tag: "AI",
  },
  {
    Icon: ShareIcon,
    title: "Shareable itineraries",
    description:
      "Publish a read-only link anyone can open without an account — and anyone can copy into their own workspace as a starting point.",
    tag: "Sharing",
  },
];

export function ServicesSection() {
  return (
    <section id="services" className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <Reveal>
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wider text-primary">What we do</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Everything a trip needs, in one workspace
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
              Eight things we do properly, instead of forty we do badly. Each one feeds the same
              plan, so a hotel you pick, an activity you schedule and a guide you hire all land in
              the same itinerary and the same running total.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map(({ Icon, title, description, tag }, index) => (
            <Reveal key={title} delay={(index % 4) * 80}>
              <article className="group flex h-full flex-col rounded-3xl border border-border bg-surface p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-foreground hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="rounded-full bg-[#f0f0f0] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-muted">
                    {tag}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={100}>
          <div className="mt-10 flex justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-bold text-white transition-all hover:gap-3 hover:bg-black"
            >
              Try all of it free
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

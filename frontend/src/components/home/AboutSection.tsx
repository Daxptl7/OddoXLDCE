import Image from "next/image";
import { Reveal } from "@/components/home/Reveal";
import { HeartIcon, LeafIcon, ShieldIcon, WalletIcon } from "@/components/ui/Icons";

const values = [
  {
    Icon: WalletIcon,
    title: "The budget is the plan",
    description:
      "Every activity you add moves the total the moment you add it. No spreadsheet on the side, no nasty arithmetic the week before you fly.",
  },
  {
    Icon: HeartIcon,
    title: "Locals over listicles",
    description:
      "The best day of a trip is usually the one somebody who lives there planned. Hiring a guide for a day or three is a first-class feature here, not an afterthought.",
  },
  {
    Icon: ShieldIcon,
    title: "Your plan stays yours",
    description:
      "Trips are private until you publish a share link, and a guide only gets your phone number once you have both agreed on the days.",
  },
  {
    Icon: LeafIcon,
    title: "Slow beats packed",
    description:
      "We warn you about overlapping stays, empty days and stops that fall outside your dates — then let you decide. Advice, never a wall.",
  },
];

export function AboutSection() {
  return (
    <section id="about" className="bg-surface">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-28">
        <Reveal>
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-primary">About us</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Trip planning that does the boring half for you
            </h2>
            <div className="mt-6 flex flex-col gap-4 text-base leading-relaxed text-muted">
              <p>
                GoVenture started with a familiar mess: eleven browser tabs, a notes app full of
                half-remembered restaurant names, and a spreadsheet nobody updated after day two.
                Multi-city trips are genuinely hard to hold in your head — the dates shift, the
                costs compound, and the good local knowledge lives in people, not in blog posts.
              </p>
              <p>
                So we built one workspace for the whole journey. Chain cities together and the dates
                re-flow themselves. Attach activities and the budget derives itself from your actual
                itinerary. Land somewhere you have never been and hire someone who lives there for
                exactly the days you need them.
              </p>
              <p className="font-semibold text-foreground">
                One plan, one running total, and a real person waiting at the station.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative col-span-full h-56 overflow-hidden rounded-3xl sm:h-64">
              <Image
                src="/tropical-island-aerial-view.jpg"
                alt="Aerial view of a tropical island"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            {values.map(({ Icon, title, description }) => (
              <div key={title} className="rounded-3xl border border-border bg-background p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3.5 text-base font-bold text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted">{description}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

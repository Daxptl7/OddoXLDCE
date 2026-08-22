import { Reveal } from "@/components/home/Reveal";
import { CalendarIcon, CompassIcon, ShareIcon, WalletIcon } from "@/components/ui/Icons";

const steps = [
  {
    Icon: CompassIcon,
    title: "Add your stops",
    description:
      "Search cities, set the dates for each stay, and drag to reorder. The whole trip re-chains itself so the dates always match the order.",
  },
  {
    Icon: CalendarIcon,
    title: "Attach activities",
    description:
      "Pick from each city's catalogue, drop things onto specific days and times, and override any price that does not match what you were quoted.",
  },
  {
    Icon: WalletIcon,
    title: "Watch the budget move",
    description:
      "Live totals per stop, per category and per day, measured against the target you set. Nothing is stored — it is derived from the plan itself.",
  },
  {
    Icon: ShareIcon,
    title: "Share it, or bring a guide",
    description:
      "Publish a read-only link anyone can copy, and hire a local guide for the days you would rather not figure out alone.",
  },
];

export function WorkflowSection() {
  return (
    <section id="workflow" className="bg-surface">
      <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <Reveal>
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wider text-primary">How it works</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Plan the full trip loop
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
              Four steps from an empty page to a costed, shareable, guided itinerary — and you can
              stop after any one of them.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ Icon, title, description }, index) => (
            <Reveal key={title} delay={index * 90}>
              <div className="relative h-full rounded-3xl border border-border bg-background p-6">
                <span className="absolute right-6 top-5 text-4xl font-extrabold text-[#ececec]">
                  {index + 1}
                </span>
                <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-primary">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="relative mt-5 text-lg font-bold text-foreground">{title}</h3>
                <p className="relative mt-2 text-sm leading-6 text-muted">{description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

import { CalendarIcon, CompassIcon, ShareIcon, WalletIcon } from "@/components/ui/Icons";

const steps = [
  {
    Icon: CompassIcon,
    title: "Add your stops",
    description: "Search cities, set dates, and reorder stops by dragging.",
  },
  {
    Icon: CalendarIcon,
    title: "Attach activities",
    description: "Pick activities from each city catalogue and schedule them.",
  },
  {
    Icon: WalletIcon,
    title: "Watch the budget update",
    description: "See live totals, per-day spend, and budget health.",
  },
  {
    Icon: ShareIcon,
    title: "Share the plan",
    description: "Publish a read-only itinerary that another traveler can copy.",
  },
];

export function WorkflowSection() {
  return (
    <section id="workflow" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Plan the full trip loop</h2>
        <p className="max-w-2xl text-sm text-muted">
          The core GlobeTrotter flow stays intact: cities, dates, activities, budget, calendar, and public sharing.
        </p>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ Icon, title, description }) => (
          <div key={title} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-base font-bold text-foreground">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

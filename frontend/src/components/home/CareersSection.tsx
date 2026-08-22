import { Reveal } from "@/components/home/Reveal";
import { ArrowRightIcon, BriefcaseIcon, GlobeIcon, HeartIcon, SparklesIcon } from "@/components/ui/Icons";

const CAREERS_EMAIL = "careers@goventure.app";

/**
 * Placeholder careers copy — edit `roles` and `CAREERS_EMAIL` to match what the
 * team is actually recruiting for before this goes anywhere public.
 */
const roles = [
  {
    title: "Full-stack Engineer",
    team: "Product",
    location: "Ahmedabad / Remote",
    type: "Full-time",
    blurb: "TypeScript across Next.js and Express, with Postgres and Prisma underneath.",
  },
  {
    title: "Product Designer",
    team: "Design",
    location: "Remote",
    type: "Full-time",
    blurb: "Own the itinerary builder end to end — the densest screen we have.",
  },
  {
    title: "Guide Community Lead",
    team: "Operations",
    location: "Hybrid",
    type: "Full-time",
    blurb: "Recruit and verify local guides, city by city, and keep the bar high.",
  },
  {
    title: "Data / ML Engineer",
    team: "AI",
    location: "Remote",
    type: "Contract",
    blurb: "Make the trip assistant better at scheduling, budgets and recommendations.",
  },
];

const perks = [
  { Icon: GlobeIcon, title: "Remote-first", text: "Work from wherever the wifi holds." },
  { Icon: SparklesIcon, title: "Travel stipend", text: "You cannot build this without going places." },
  { Icon: HeartIcon, title: "Real ownership", text: "Small team, wide scope, your name on it." },
];

export function CareersSection() {
  return (
    <section id="careers" className="bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <Reveal>
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                <BriefcaseIcon className="h-4 w-4" />
                We&apos;re hiring
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Come build the rest of it
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
                We are a small team with an unreasonably large roadmap. If you have ever rebuilt an
                itinerary in a spreadsheet at 1am, you already understand the problem well enough to
                work here.
              </p>
            </div>
            <a
              href={`mailto:${CAREERS_EMAIL}`}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-bold text-foreground transition-all hover:gap-3 hover:border-foreground hover:bg-background"
            >
              Send us your work
              <ArrowRightIcon className="h-4 w-4" />
            </a>
          </div>
        </Reveal>

        <div className="mt-12 flex flex-col gap-3">
          {roles.map((role, index) => (
            <Reveal key={role.title} delay={index * 70}>
              <a
                href={`mailto:${CAREERS_EMAIL}?subject=${encodeURIComponent(`Application: ${role.title}`)}`}
                className="group flex flex-col gap-4 rounded-3xl border border-border bg-background p-6 transition-all hover:border-foreground hover:bg-surface hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-lg font-bold text-foreground">{role.title}</h3>
                    <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary">
                      {role.team}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted">{role.blurb}</p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <div className="text-right text-sm">
                    <p className="font-semibold text-foreground">{role.location}</p>
                    <p className="text-muted">{role.type}</p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted transition-colors group-hover:border-foreground group-hover:bg-foreground group-hover:text-white">
                    <ArrowRightIcon className="h-4 w-4" />
                  </span>
                </div>
              </a>
            </Reveal>
          ))}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {perks.map(({ Icon, title, text }, index) => (
            <Reveal key={title} delay={index * 80}>
              <div className="flex items-start gap-3 rounded-2xl bg-background p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-bold text-foreground">{title}</p>
                  <p className="mt-0.5 text-sm text-muted">{text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

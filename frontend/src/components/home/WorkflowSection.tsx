const steps = [
  {
    title: "Add your stops",
    description: "Search cities, set arrival and departure dates, and reorder them by dragging — dates re-flow automatically.",
  },
  {
    title: "Attach activities",
    description: "Pick activities from each city's catalogue and schedule them onto a stop, with an optional cost override.",
  },
  {
    title: "Watch the budget update",
    description: "The breakdown, per-day spend, and budget health bar are all derived live — nothing here is typed in.",
  },
];

export function WorkflowSection() {
  return (
    <section id="workflow" className="mx-auto max-w-5xl px-6 py-20">
      <h2 className="text-center text-2xl font-semibold text-foreground sm:text-3xl">How GlobeTrotter works</h2>
      <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step.title} className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-primary">Step {index + 1}</span>
            <h3 className="text-lg font-medium text-foreground">{step.title}</h3>
            <p className="text-sm text-muted">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

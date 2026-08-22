import { Reveal } from "@/components/home/Reveal";
import { ChevronDownIcon } from "@/components/ui/Icons";

const faqs = [
  {
    question: "Does it cost anything to plan a trip?",
    answer:
      "No. Building trips, adding stops and activities, the derived budget, weather, hotel search and the share link are all free. The only money that changes hands is between you and a guide you hire, at the rate shown on their profile.",
  },
  {
    question: "How does hiring a guide actually work?",
    answer:
      "Pick a city, pick your dates, and you will only see guides who are free across that whole range. Send a request with your group size and any notes; the guide accepts or declines. Once they accept, their phone number and email appear on your booking — and yours on theirs.",
  },
  {
    question: "What happens if a guide cancels or something changes?",
    answer:
      "You can cancel a pending or confirmed booking yourself at any time. If a guide has to drop out, our team can reassign the booking to another available guide in the same city, keeping your dates intact — you will see a note explaining what changed.",
  },
  {
    question: "Can two people book the same guide for the same days?",
    answer:
      "No. Every booking re-checks that guide's calendar before it is written, so a double booking is refused with the clashing dates spelled out. The same check protects you from accidentally hiring two guides for one day.",
  },
  {
    question: "Is my itinerary private?",
    answer:
      "Yes, by default. A trip is visible only to you until you publish a share link, and that link is a random slug rather than a sequential id, so nobody can guess their way into other people's trips. Turn sharing off and the link 404s immediately.",
  },
  {
    question: "How is the budget calculated?",
    answer:
      "It is never stored — it is derived from your itinerary every time you open it. Transport and stay costs come from each stop, activity costs from what you scheduled (with your own price override if you set one), and it all rolls up per stop, per category and per day against your target.",
  },
  {
    question: "I guide professionally. How do I join?",
    answer:
      "Sign up and choose \"I'm a guide\", then tell us your city, your daily rate and the languages you work in. Your listing goes live straight away, and our team verifies profiles on a rolling basis — verified guides get a badge and rank higher in the directory.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="bg-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:py-28">
        <Reveal>
          <div className="lg:sticky lg:top-24">
            <p className="text-sm font-bold uppercase tracking-wider text-primary">FAQ</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Questions people actually ask
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted">
              Still stuck? The assistant in the corner of this page answers most things, and a real
              human reads everything sent to{" "}
              <a href="mailto:hello@goventure.app" className="font-semibold text-primary hover:underline">
                hello@goventure.app
              </a>
              .
            </p>
          </div>
        </Reveal>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, index) => (
            <Reveal key={faq.question} delay={index * 50}>
              {/* <details> keeps the accordion working with no client JS at all. */}
              <details className="group rounded-2xl border border-border bg-surface px-5 py-4 transition-colors open:border-foreground hover:border-foreground">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-foreground [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <ChevronDownIcon className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-7 text-muted">{faq.answer}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

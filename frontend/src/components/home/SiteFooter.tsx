import Link from "next/link";
import {
  GithubIcon,
  InstagramIcon,
  LinkedinIcon,
  LogoIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  TwitterIcon,
} from "@/components/ui/Icons";

const columns: Array<{ heading: string; links: Array<{ label: string; href: string }> }> = [
  {
    heading: "Product",
    links: [
      { label: "Trip builder", href: "/signup" },
      { label: "Budget tracking", href: "/#services" },
      { label: "Weather & hotels", href: "/#services" },
      { label: "AI assistant", href: "/#services" },
      { label: "Shared itineraries", href: "/#services" },
    ],
  },
  {
    heading: "Guides",
    links: [
      { label: "Find a guide", href: "/guides" },
      { label: "Become a guide", href: "/signup" },
      { label: "How booking works", href: "/#faq" },
      { label: "Verification", href: "/#guides" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About us", href: "/#about" },
      { label: "What we do", href: "/#services" },
      { label: "Careers", href: "/#careers" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
];

const socials = [
  { label: "X", href: "https://x.com", Icon: TwitterIcon },
  { label: "Instagram", href: "https://instagram.com", Icon: InstagramIcon },
  { label: "LinkedIn", href: "https://linkedin.com", Icon: LinkedinIcon },
  { label: "GitHub", href: "https://github.com", Icon: GithubIcon },
];

/** Swap these for the real thing before launch — they are placeholders. */
const CONTACT = {
  email: "hello@goventure.app",
  phone: "+91 98765 43210",
  address: "Ahmedabad, Gujarat, India",
};

export function SiteFooter() {
  return (
    <footer className="bg-[#141414] text-white/70">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
              <LogoIcon className="h-8 w-8 text-primary" />
              GoVenture
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-7">
              Smart itineraries, authentic adventures and real-time budgets. Plan a multi-city trip
              in one place, and hire someone who lives there to show you around.
            </p>

            <ul className="mt-6 flex flex-col gap-2.5 text-sm">
              <li>
                <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2.5 hover:text-white">
                  <MailIcon className="h-4 w-4 text-primary" />
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} className="flex items-center gap-2.5 hover:text-white">
                  <PhoneIcon className="h-4 w-4 text-primary" />
                  {CONTACT.phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPinIcon className="h-4 w-4 text-primary" />
                {CONTACT.address}
              </li>
            </ul>

            <div className="mt-6 flex gap-2.5">
              {socials.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white/70 transition-colors hover:border-white/40 hover:bg-white/15 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((column) => (
              <div key={column.heading}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">{column.heading}</h3>
                <ul className="mt-4 flex flex-col gap-2.5 text-sm">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="transition-colors hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Account</h3>
              <ul className="mt-4 flex flex-col gap-2.5 text-sm">
                <li>
                  <Link href="/login" className="transition-colors hover:text-white">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="transition-colors hover:text-white">
                    Create an account
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="transition-colors hover:text-white">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/trips" className="transition-colors hover:text-white">
                    My trips
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} GoVenture. Built for travellers who hate spreadsheets.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/#faq" className="transition-colors hover:text-white">
              Help centre
            </Link>
            <Link href="/#about" className="transition-colors hover:text-white">
              Privacy
            </Link>
            <Link href="/#about" className="transition-colors hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

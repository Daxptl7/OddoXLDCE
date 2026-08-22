"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "@/lib/auth/AuthContext";
import { homePathFor, ROLE_LABEL } from "@/lib/auth/roles";
import {
  BuildingIcon,
  CalendarIcon,
  CompassIcon,
  HomeIcon,
  LogoIcon,
  MenuIcon,
  ShieldIcon,
  UserIcon,
  UsersIcon,
} from "@/components/ui/Icons";
import type { UserRole } from "@/lib/types";

type NavLink = { href: string; label: string; Icon: typeof HomeIcon };

/** Each role gets its own navigation — nobody sees a tab the API would 403. */
const linksByRole: Record<UserRole, NavLink[]> = {
  USER: [
    { href: "/dashboard", label: "Dashboard", Icon: HomeIcon },
    { href: "/trips", label: "My Trips", Icon: CompassIcon },
    { href: "/guides", label: "Find a Guide", Icon: UsersIcon },
    { href: "/bookings", label: "My Guides", Icon: CalendarIcon },
    { href: "/hotels", label: "Hotels", Icon: BuildingIcon },
  ],
  GUIDE: [
    { href: "/guide", label: "Assignments", Icon: CalendarIcon },
    { href: "/guide/profile", label: "My Profile", Icon: UserIcon },
  ],
  ADMIN: [
    { href: "/admin", label: "Console", Icon: ShieldIcon },
    { href: "/guides", label: "Guide Directory", Icon: UsersIcon },
  ],
};

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const role = user?.role ?? "USER";
  const links = linksByRole[role];

  // /guide would otherwise light up on /guides, and /admin on nothing else.
  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href={homePathFor(role)} className="flex items-center gap-2 text-lg font-bold text-primary">
            <LogoIcon className="h-8 w-8" />
            <span className="hidden sm:inline">GoVenture</span>
          </Link>
          <nav className="hidden gap-1 lg:flex">
            {links.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
                  isActive(href)
                    ? "bg-rose-50 text-primary"
                    : "text-muted hover:bg-[#f7f7f7] hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {role !== "USER" ? (
            <span className="hidden rounded-full bg-[#f7f7f7] px-3 py-1 text-xs font-bold uppercase tracking-wide text-foreground sm:inline">
              {ROLE_LABEL[role]}
            </span>
          ) : null}
          <Link
            href={role === "GUIDE" ? "/guide/profile" : "/profile"}
            className="flex items-center gap-2 rounded-full border border-border bg-white px-2 py-1.5 text-sm font-semibold text-foreground shadow-sm transition-shadow hover:shadow-md"
          >
            <MenuIcon className="h-5 w-5 text-muted" />
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#222222] text-white">
              <UserIcon className="h-4 w-4" />
            </span>
            <span className="hidden max-w-[120px] truncate pr-2 md:inline">{user?.name ?? "Profile"}</span>
          </Link>
          <button
            onClick={() => logout()}
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-muted hover:bg-[#f7f7f7] hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* The same links, wrapped, for narrow screens. */}
      <nav className="scrollbar-hide flex gap-1 overflow-x-auto border-t border-border px-4 py-2 lg:hidden">
        {links.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "inline-flex min-w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold",
              isActive(href) ? "bg-rose-50 text-primary" : "text-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

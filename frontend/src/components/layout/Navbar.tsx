"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "@/lib/auth/AuthContext";
import { CompassIcon, HomeIcon, LogoIcon, MenuIcon, UserIcon } from "@/components/ui/Icons";

const links = [
  { href: "/dashboard", label: "Dashboard", Icon: HomeIcon },
  { href: "/trips", label: "My Trips", Icon: CompassIcon },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-bold text-primary">
            <LogoIcon className="h-8 w-8" />
            <span className="hidden sm:inline">GlobeTrotter</span>
          </Link>
          <nav className="hidden gap-1 sm:flex">
            {links.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
                  pathname?.startsWith(href) ? "bg-rose-50 text-primary" : "text-muted hover:bg-[#f7f7f7] hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
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
    </header>
  );
}

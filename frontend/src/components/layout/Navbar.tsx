"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "@/lib/auth/AuthContext";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/trips", label: "My Trips" },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-semibold text-foreground">
            GlobeTrotter
          </Link>
          <nav className="hidden gap-1 sm:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "rounded-md px-3 py-1.5 text-sm font-medium",
                  pathname?.startsWith(link.href) ? "bg-blue-50 text-primary" : "text-muted hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/profile" className="text-sm font-medium text-muted hover:text-foreground">
            {user?.name ?? "Profile"}
          </Link>
          <button
            onClick={() => logout()}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-muted hover:bg-slate-100 hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

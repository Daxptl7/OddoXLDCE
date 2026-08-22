"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { LogoIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/ui/Icons";

export function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-50 border-b transition-all duration-300",
        scrolled ? "border-border bg-white/95 shadow-sm backdrop-blur" : "border-white/20 bg-white/90 backdrop-blur",
      )}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary">
          <LogoIcon className="h-8 w-8" />
          <span className="hidden sm:inline">GlobeTrotter</span>
        </Link>
        <nav className="hidden items-center rounded-full border border-border bg-white px-2 py-1 shadow-sm md:flex">
          <Link href="/" className="rounded-full px-4 py-2 text-sm font-semibold text-foreground hover:bg-[#f7f7f7]">
            Homes
          </Link>
          <a href="#workflow" className="rounded-full px-4 py-2 text-sm font-semibold text-foreground hover:bg-[#f7f7f7]">
            Experiences
          </a>
          <Link href="/trips" className="rounded-full px-4 py-2 text-sm font-semibold text-foreground hover:bg-[#f7f7f7]">
            Trips
          </Link>
          <Link href="/signup" className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">
            <SearchIcon className="h-4 w-4" />
          </Link>
        </nav>
        <div className="flex justify-end">
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-foreground hover:bg-[#f7f7f7] sm:block">
              Login
            </Link>
            <Link
              href="/signup"
              aria-label="Sign up"
              className="flex items-center gap-2 rounded-full border border-border bg-white px-2 py-1.5 text-foreground shadow-sm transition-shadow hover:shadow-md"
            >
              <MenuIcon className="h-5 w-5" />
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#222222] text-white">
                <UserIcon className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

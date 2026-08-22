"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { LogoIcon, MenuIcon, UserIcon } from "@/components/ui/Icons";

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
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary">
          <LogoIcon className="h-8 w-8" />
          <span>GoVenture</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-foreground hover:bg-[#f7f7f7]">
            Login
          </Link>
          <Link
            href="/signup"
            aria-label="Sign up"
            className="flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm transition-shadow hover:shadow-md"
          >
            <MenuIcon className="h-5 w-5" />
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#222222] text-white">
              <UserIcon className="h-4 w-4" />
            </span>
            <span className="hidden sm:inline">Sign up</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

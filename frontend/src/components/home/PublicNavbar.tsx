"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { LogoIcon, MenuIcon, UserIcon } from "@/components/ui/Icons";

export function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 30);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border bg-white/95 text-foreground shadow-sm backdrop-blur"
          : "border-b border-white/10 bg-black/20 text-white backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <LogoIcon className="h-8 w-8 text-primary" />
          <span className={scrolled ? "text-foreground" : "text-white"}>GoVenture</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className={clsx(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              scrolled
                ? "text-foreground hover:bg-[#f7f7f7]"
                : "text-white hover:bg-white/15",
            )}
          >
            Login
          </Link>
          <Link
            href="/signup"
            aria-label="Sign up"
            className={clsx(
              "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold shadow-sm transition-all hover:shadow-md",
              scrolled
                ? "border-border bg-white text-foreground hover:bg-[#f7f7f7]"
                : "border-white/30 bg-white/15 text-white backdrop-blur hover:bg-white/25",
            )}
          >
            <MenuIcon className="h-4 w-4" />
            <span className={clsx("flex h-6 w-6 items-center justify-center rounded-full text-white", scrolled ? "bg-[#222222]" : "bg-white/30")}>
              <UserIcon className="h-3.5 w-3.5" />
            </span>
            <span className="hidden sm:inline">Sign up</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

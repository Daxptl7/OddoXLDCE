"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";

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
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled ? "bg-slate-900/95 shadow-md backdrop-blur" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-semibold text-white">
          GlobeTrotter
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium uppercase tracking-wide text-white/90 sm:flex">
          <Link href="/" className="hover:text-white">
            Home
          </Link>
          <a href="#workflow" className="hover:text-white">
            Workflow
          </a>
          <Link href="/login" className="hover:text-white">
            Login
          </Link>
        </nav>
        <Link
          href="/signup"
          className="rounded-md border border-white/70 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          Sign Up
        </Link>
      </div>
    </header>
  );
}

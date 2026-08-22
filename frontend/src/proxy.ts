import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TOKEN_COOKIE = "gt_token";
const AUTH_PAGES = ["/login", "/signup"];
const PROTECTED_PREFIXES = ["/dashboard", "/trips", "/profile"];

/**
 * Cheap, edge-side gate: only checks whether the token cookie exists, so a
 * logged-out visitor never even glimpses a protected page. The authoritative
 * check is GET /auth/me in AuthProvider — an expired/invalid token still
 * bounces back to /login from there.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = Boolean(request.cookies.get(TOKEN_COOKIE)?.value);

  // "/" is the public marketing homepage for logged-out visitors; signed-in
  // visitors are sent straight to their dashboard instead of the pitch.
  if (pathname === "/" && hasToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (AUTH_PAGES.includes(pathname) && hasToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && !hasToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/signup", "/dashboard/:path*", "/trips/:path*", "/profile/:path*"],
};

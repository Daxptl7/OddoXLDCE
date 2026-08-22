import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TOKEN_COOKIE = "gt_token";
const AUTH_PAGES = ["/login", "/signup"];
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/trips",
  "/profile",
  "/guides",
  "/guide",
  "/bookings",
  "/admin",
];

const HOME_PATH: Record<string, string> = {
  USER: "/dashboard",
  GUIDE: "/guide",
  ADMIN: "/admin",
};

/**
 * Reads the role claim out of the session token without verifying it. This only
 * decides which landing page to bounce a signed-in visitor to — a forged claim
 * buys nothing, because every page and every API route re-checks the real role
 * server-side.
 */
function landingPath(token: string | undefined): string {
  if (!token) return "/dashboard";
  try {
    const payload = token.split(".")[1];
    if (!payload) return "/dashboard";
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const role = (JSON.parse(json) as { role?: string }).role;
    return (role && HOME_PATH[role]) || "/dashboard";
  } catch {
    return "/dashboard";
  }
}

/**
 * Cheap, edge-side gate: only checks whether the token cookie exists, so a
 * logged-out visitor never even glimpses a protected page. The authoritative
 * check is GET /auth/me in AuthProvider — an expired/invalid token still
 * bounces back to /login from there.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const hasToken = Boolean(token);

  // "/" is the public marketing homepage for logged-out visitors; signed-in
  // visitors are sent straight to their own home instead of the pitch.
  if (pathname === "/" && hasToken) {
    return NextResponse.redirect(new URL(landingPath(token), request.url));
  }

  if (AUTH_PAGES.includes(pathname) && hasToken) {
    return NextResponse.redirect(new URL(landingPath(token), request.url));
  }

  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && !hasToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/dashboard/:path*",
    "/trips/:path*",
    "/profile/:path*",
    "/guides/:path*",
    "/guide/:path*",
    "/bookings/:path*",
    "/admin/:path*",
  ],
};

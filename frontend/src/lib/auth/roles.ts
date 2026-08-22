import type { UserRole } from "@/lib/types";

/** Where each role lands after signing in — and what "home" means in the navbar. */
export const HOME_PATH: Record<UserRole, string> = {
  USER: "/dashboard",
  GUIDE: "/guide",
  ADMIN: "/admin",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  USER: "Traveller",
  GUIDE: "Guide",
  ADMIN: "Admin",
};

export const homePathFor = (role: UserRole | undefined): string =>
  role ? HOME_PATH[role] : "/dashboard";

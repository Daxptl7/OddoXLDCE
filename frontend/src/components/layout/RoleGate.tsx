"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { homePathFor } from "@/lib/auth/roles";
import { PageSpinner } from "@/components/ui/Spinner";
import type { UserRole } from "@/lib/types";

/**
 * Client-side role guard for a whole section. The API enforces the same rule —
 * this only keeps the wrong role from staring at a wall of 403s.
 */
export function RoleGate({ allow, children }: { allow: UserRole[]; children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const allowed = user ? allow.includes(user.role) : false;

  useEffect(() => {
    if (isLoading || !user) return;
    if (!allowed) router.replace(homePathFor(user.role));
  }, [isLoading, user, allowed, router]);

  if (isLoading || !user || !allowed) return <PageSpinner />;

  return <>{children}</>;
}

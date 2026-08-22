"use client";

import { RoleGate } from "@/components/layout/RoleGate";

export default function BookingsLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate allow={["USER"]}>{children}</RoleGate>;
}

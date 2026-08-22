"use client";

import { RoleGate } from "@/components/layout/RoleGate";

export default function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate allow={["ADMIN"]}>{children}</RoleGate>;
}

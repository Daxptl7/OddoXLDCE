"use client";

import { RoleGate } from "@/components/layout/RoleGate";

export default function GuideSectionLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate allow={["GUIDE"]}>{children}</RoleGate>;
}

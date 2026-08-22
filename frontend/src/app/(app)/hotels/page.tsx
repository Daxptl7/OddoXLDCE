"use client";

import { DashboardHotelExplorer } from "@/components/hotels/DashboardHotelExplorer";

export default function HotelsPage() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHotelExplorer />
    </div>
  );
}

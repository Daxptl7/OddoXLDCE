"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/format";
import type { BudgetStopBreakdown } from "@/lib/types";

export function BudgetByStopChart({ byStop }: { byStop: BudgetStopBreakdown[] }) {
  if (byStop.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">Add stops to see a per-city breakdown.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={byStop}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="city" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(value: number) => formatMoney(value)} width={80} />
        <Tooltip formatter={(value) => formatMoney(Number(value))} />
        <Legend />
        <Bar dataKey="transport" stackId="cost" fill="#2563eb" name="Transport" />
        <Bar dataKey="accommodation" stackId="cost" fill="#16a34a" name="Accommodation" />
        <Bar dataKey="activities" stackId="cost" fill="#d97706" name="Activities" />
      </BarChart>
    </ResponsiveContainer>
  );
}

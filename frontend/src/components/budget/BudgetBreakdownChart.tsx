"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatMoney } from "@/lib/format";

const COLORS = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];

export function BudgetBreakdownChart({ breakdown }: { breakdown: Array<{ name: string; value: number }> }) {
  if (breakdown.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">Add costs to see the breakdown.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={breakdown} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
          {breakdown.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatMoney(Number(value))} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

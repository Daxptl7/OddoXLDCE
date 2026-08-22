import clsx from "clsx";
import { formatMoney } from "@/lib/format";
import type { BudgetHealth } from "@/lib/types";

const toneByStatus: Record<BudgetHealth["status"], string> = {
  healthy: "bg-success",
  warning: "bg-warning",
  over: "bg-danger",
  unset: "bg-slate-300",
};

const labelByStatus: Record<BudgetHealth["status"], string> = {
  healthy: "On track",
  warning: "Approaching your budget",
  over: "Over budget",
  unset: "No target budget set",
};

export function BudgetHealthBar({ target }: { target: BudgetHealth }) {
  const percent = Math.min(target.percentUsed ?? 0, 100);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{labelByStatus[target.status]}</span>
        <span className="text-muted">
          {formatMoney(target.spent)}
          {target.budget !== null ? ` of ${formatMoney(target.budget)}` : ""}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={clsx("h-full rounded-full transition-all", toneByStatus[target.status])}
          style={{ width: target.status === "unset" ? "0%" : `${percent}%` }}
        />
      </div>
      {target.remaining !== null ? (
        <p className="text-xs text-muted">
          {target.remaining >= 0 ? `${formatMoney(target.remaining)} remaining` : `${formatMoney(-target.remaining)} over`}
        </p>
      ) : null}
    </div>
  );
}

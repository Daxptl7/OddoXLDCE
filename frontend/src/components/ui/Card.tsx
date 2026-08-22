import { forwardRef, type HTMLAttributes } from "react";
import clsx from "clsx";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Card(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={clsx("rounded-2xl border border-border bg-surface shadow-sm", className)} {...props} />;
});

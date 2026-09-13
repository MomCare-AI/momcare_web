import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Thin wrappers around the portal's existing .mc-card/.mc-card-head/
 * .mc-card-body classes — the same three-part card shape repeated at
 * every section of every dashboard page, currently as raw
 * `<section className="mc-card">` markup. These render the identical
 * DOM/classes as that raw markup; the only change is naming the wrapper,
 * not what it looks like. `className`/`style`/other props pass through
 * unchanged, so a call site with an extra class or inline style keeps it.
 */
export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("mc-card", className)} {...props} />;
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mc-card-head", className)} {...props} />;
}

export function CardBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mc-card-body", className)} {...props} />;
}

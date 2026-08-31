import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

/** A trail down to the current page. The last crumb is never a link — it's
 *  where you already are. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mc-breadcrumbs">
      <ol>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.label}>
              {item.href && !isLast ? (
                <Link href={item.href}>{item.label}</Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight
                  size={13}
                  strokeWidth={2}
                  aria-hidden
                  className="mc-breadcrumbs-sep"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

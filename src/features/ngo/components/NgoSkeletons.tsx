import { Skeleton } from "@/components/ui/skeleton";

/** Table body rows shown while a list loads. Varying widths avoid a "barcode" look. */
export function TableRowsSkeleton({
  rows = 6,
  cols,
}: {
  rows?: number;
  cols: number;
}) {
  const widths = ["w-24", "w-16", "w-20", "w-12", "w-28", "w-32"];
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} aria-hidden>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-4">
              <Skeleton
                className={`h-4 ${widths[(r + c) % widths.length]} ${
                  c === 2 ? "h-6 rounded-full" : ""
                }`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** A stat card's value while its number loads. */
export function StatValueSkeleton() {
  return <Skeleton className="mt-3 h-7 w-28" aria-hidden />;
}

/** Page heading + subtitle placeholder. */
export function PageHeadingSkeleton() {
  return (
    <div aria-hidden>
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
    </div>
  );
}

/** Route-level placeholder: a heading and a row of cards. */
export function NgoPageSkeleton() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <PageHeadingSkeleton />
      <div
        className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-hidden
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <Skeleton className="h-3 w-24" />
            <StatValueSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Silhouette of the real shell (teal sidebar + content) shown while the NGO
 * session is still being read, so the page doesn't flash blank.
 */
export function NgoShellSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50" role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <aside
        aria-hidden
        className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-3 bg-teal-700 p-5 md:flex"
      >
        <Skeleton className="mb-4 h-[91px] w-32 rounded-xl bg-white/20" />
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full bg-white/15" />
        ))}
      </aside>
      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
          <PageHeadingSkeleton />
        </div>
      </main>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardBody } from "@/shared/ui/Card";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";

/** Heading, a row of stat tiles and a list: the shape of most Platform Admin pages. */
export function PlatformPageSkeleton() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div aria-hidden>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />

        <div className="mc-kpis" style={{ marginTop: 22 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="mc-kpi">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2 h-7 w-12" />
            </div>
          ))}
        </div>

        <Card>
          <CardBody>
            <div className="mc-rows">
              <RowSkeleton count={4} variant="plain" />
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

/**
 * A silhouette of the real shell (dark sidebar + page) shown while the
 * signed-in role is being checked, so the screen never flashes blank.
 */
export function PlatformShellSkeleton() {
  return (
    <div className="flex min-h-screen w-full" role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <aside
        aria-hidden
        className="hidden h-screen w-64 shrink-0 flex-col gap-3 bg-slate-900 p-5 md:flex"
      >
        <Skeleton className="mb-4 h-10 w-40 bg-white/15" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full bg-white/10" />
        ))}
      </aside>
      <main className="pa-main min-w-0 flex-1" aria-hidden>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />
        <Skeleton className="mt-6 h-64 w-full" />
      </main>
    </div>
  );
}

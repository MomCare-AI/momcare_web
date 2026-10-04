import { Skeleton } from "@/components/ui/skeleton";

/**
 * Stands in for PatientsTable while a list loads: the same toolbar (search
 * box and filters button) and rows with the same column rhythm, so the page
 * does not jump when the real patients arrive.
 */
export function PatientsTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading patients…</span>
      <div aria-hidden>
        <div className="mc-table-toolbar">
          <Skeleton className="h-9 w-full max-w-sm" />
          <Skeleton className="h-8 w-36" />
        </div>
        <div className="mc-rows" style={{ marginTop: 14 }}>
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="mc-row"
              style={{ gap: 18, alignItems: "center" }}
            >
              <Skeleton
                className="shrink-0 rounded-full"
                style={{ width: 38, height: 38 }}
              />
              <div style={{ flex: "2 1 160px", minWidth: 0 }}>
                <Skeleton
                  className="h-4"
                  style={{ width: "55%", marginBottom: 8 }}
                />
                <Skeleton className="h-3" style={{ width: "35%" }} />
              </div>
              <Skeleton
                className="hidden h-4 sm:block"
                style={{ flex: "1 1 90px", maxWidth: 140 }}
              />
              <Skeleton
                className="hidden h-4 md:block"
                style={{ flex: "1 1 90px", maxWidth: 140 }}
              />
              <Skeleton
                className="shrink-0 rounded-full"
                style={{ width: 74, height: 22 }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading placeholder shaped like the list rows it stands in for, so the
 * page doesn't jump once real rows replace it. Two variants because the
 * portal has exactly two row shapes: a bordered card per row (alerts,
 * devices) and a borderless row inside one shared card (patients, staff).
 */
export function RowSkeleton({
  count = 4,
  variant = "card",
}: {
  count?: number;
  variant?: "card" | "plain";
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: variant === "card" ? 18 : 14,
            padding: variant === "card" ? "14px 18px" : "13px 20px",
            ...(variant === "card"
              ? {
                  border: "1px solid var(--c-border)",
                  borderRadius: "var(--r-card)",
                  background: "var(--c-card)",
                }
              : { borderBottom: "1px solid var(--c-border-soft)" }),
          }}
        >
          <Skeleton
            className="rounded-full shrink-0"
            style={{ width: 38, height: 38 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Skeleton
              className="h-4"
              style={{ width: "38%", marginBottom: 8 }}
            />
            <Skeleton className="h-3" style={{ width: "62%" }} />
          </div>
          <Skeleton
            className="rounded-full shrink-0"
            style={{ width: 74, height: 22 }}
          />
        </div>
      ))}
    </>
  );
}

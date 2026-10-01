import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown the moment someone lands in the portal, while `org`/`user` are
 * still loading — replaces the old plain "Loading your hospital…" text
 * with a silhouette of the real shell (sidebar + topbar + content cards),
 * so the transition into the real dashboard doesn't read as a jump cut.
 * Nothing here is real data (no org/role is known yet at this point), so
 * it's deliberately generic rather than guessing at nav items or counts.
 */
export function DashboardSkeleton() {
  return (
    <div className="mc-portal">
      <div
        style={{
          width: 236,
          flex: "none",
          height: "100vh",
          background: "var(--c-teal)",
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <Skeleton
          className="bg-white/15"
          style={{ width: "70%", height: 20, marginBottom: 18 }}
        />
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className="bg-white/10"
            style={{ width: "100%", height: 34, borderRadius: 8 }}
          />
        ))}
      </div>

      <div className="mc-shell">
        <div
          style={{
            height: 64,
            borderBottom: "1px solid var(--c-border)",
            display: "flex",
            alignItems: "center",
            padding: "0 28px",
          }}
        >
          <Skeleton style={{ width: 160, height: 16 }} />
        </div>

        <div className="mc-page">
          <Skeleton style={{ width: 220, height: 24, marginBottom: 20 }} />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 18,
              marginBottom: 24,
            }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} style={{ height: 92, borderRadius: 14 }} />
            ))}
          </div>

          <Skeleton style={{ height: 320, borderRadius: 14 }} />
        </div>
      </div>
    </div>
  );
}

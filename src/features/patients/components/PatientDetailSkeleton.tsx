import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown while a patient's own record (`usePatient`) is still loading —
 * replaces the old plain "Loading patient…" text with a silhouette of the
 * real page (header banner, tab strip, Overview's three-card row), so
 * opening a patient doesn't read as a jump cut from table to content.
 * Nothing here is real data — no patient is known yet at this point.
 */
export function PatientDetailSkeleton() {
  return (
    <div>
      <Skeleton style={{ width: 90, height: 16, marginBottom: 14 }} />

      <div
        className="mc-hero"
        style={{
          marginBottom: 18,
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Skeleton
            className="rounded-full"
            style={{ width: 38, height: 38 }}
          />
          <div>
            <Skeleton style={{ width: 160, height: 16, marginBottom: 6 }} />
            <Skeleton style={{ width: 220, height: 12 }} />
          </div>
        </div>
        <Skeleton style={{ width: 90, height: 28, borderRadius: 999 }} />
      </div>

      <div
        style={{
          display: "flex",
          gap: 24,
          borderBottom: "1px solid var(--c-border)",
          marginBottom: 20,
          paddingBottom: 12,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} style={{ width: 70, height: 14 }} />
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr",
          gap: 18,
          marginBottom: 18,
        }}
      >
        <Skeleton style={{ height: 160, borderRadius: 14 }} />
        <Skeleton style={{ height: 160, borderRadius: 14 }} />
        <Skeleton style={{ height: 160, borderRadius: 14 }} />
      </div>

      <Skeleton style={{ height: 220, borderRadius: 14 }} />
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

// Placeholder shapes for the below-the-fold sections that are code-split
// via next/dynamic (see LandingPageClient.tsx). Each mirrors that
// section's actual layout at a glance, so the page doesn't jump once the
// real chunk arrives and mounts in its place.

export function ValuePillarsSkeleton() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <Skeleton className="h-9 w-72 mx-auto mb-4" />
        <Skeleton className="h-5 w-96 max-w-full mx-auto mb-12" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl p-6 space-y-3 bg-zinc-50">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
          <div className="rounded-2xl p-6 space-y-3 bg-zinc-50">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function EngineShowcaseSkeleton() {
  return (
    <section className="py-24" style={{ background: "var(--bg)" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 mb-10">
          <Skeleton className="h-11 w-full max-w-xl" />
          <Skeleton className="h-11 w-40" />
        </div>
        <Skeleton className="w-full aspect-video rounded-2xl" />
      </div>
    </section>
  );
}

export function IntegrationHubSkeleton() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <Skeleton className="h-9 w-80 mx-auto mb-12" />
        <div className="grid grid-cols-3 gap-6 items-center">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-40 w-40 rounded-full mx-auto" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function OurTeamSkeleton() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <Skeleton className="h-9 w-64 mx-auto mb-12" />
        <div className="grid md:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-4">
              <Skeleton className="h-28 w-28 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItsBuiltSkeleton() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-4">
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-md" />
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqCarouselSkeleton() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <Skeleton className="h-9 w-48 mx-auto mb-10" />
        <div className="rounded-2xl border border-zinc-200 p-6 space-y-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="flex justify-center gap-3 mt-6">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>
    </section>
  );
}

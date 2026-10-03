"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { OrgRowItem } from "@/features/platform-admin/components/OrgRowItem";
import { PlatformPageSkeleton } from "@/features/platform-admin/components/PlatformSkeletons";
import { PreviewNotice } from "@/features/platform-admin/components/PreviewNotice";
import { useApplications } from "@/features/platform-admin/hooks/usePlatformAdmin";
import {
  GROUP_LABEL,
  type ApplicationFilters,
  type OrgType,
  type StatusGroup,
} from "@/features/platform-admin/types";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { Card, CardBody } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";
import { TagChip } from "@/shared/ui/TagChip";

const TYPE_TABS: { value: OrgType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "hospital", label: "Hospitals" },
  { value: "ngo", label: "NGOs" },
];

const GROUPS: (StatusGroup | "all")[] = [
  "all",
  "pending",
  "approved",
  "rejected",
  "suspended",
];

const asType = (v: string | null): OrgType | "all" =>
  v === "hospital" || v === "ngo" ? v : "all";

const asGroup = (v: string | null): StatusGroup | "all" =>
  GROUPS.includes(v as StatusGroup) && v !== "all" ? (v as StatusGroup) : "all";

function Applications() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Filters start from the URL (so a refresh or a shared link keeps the view)
  // and are written back to it as they change.
  const [type, setType] = useState(() => asType(params.get("type")));
  const [group, setGroup] = useState(() => asGroup(params.get("status")));
  const [search, setSearch] = useState(() => params.get("q") ?? "");
  const debouncedSearch = useDebouncedValue(search, 250);

  const filters: ApplicationFilters = useMemo(
    () => ({ type, group, search: debouncedSearch }),
    [type, group, debouncedSearch]
  );

  useEffect(() => {
    const next = new URLSearchParams();
    if (type !== "all") next.set("type", type);
    if (group !== "all") next.set("status", group);
    if (debouncedSearch.trim()) next.set("q", debouncedSearch.trim());
    const qs = next.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    const current = params.toString();
    if (qs !== current) router.replace(url, { scroll: false });
  }, [type, group, debouncedSearch, pathname, params, router]);

  const { data, isPending, isError, isPlaceholderData } =
    useApplications(filters);
  const filtered = type !== "all" || group !== "all" || search.trim() !== "";

  const clear = () => {
    setType("all");
    setGroup("all");
    setSearch("");
  };

  return (
    <>
      <h1 className="mc-h1">Applications</h1>
      <p className="mc-sub" style={{ marginBottom: 18 }}>
        Hospitals and NGOs that have applied to use MomCare. Open one to review
        it.
      </p>
      <PreviewNotice />

      <div className="mc-tabs" role="tablist" aria-label="Organization type">
        {TYPE_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={type === t.value}
            className="mc-tab"
            style={
              type === t.value
                ? {
                    color: "var(--c-ink)",
                    fontWeight: 700,
                    boxShadow: "inset 0 -2px 0 var(--c-teal)",
                  }
                : undefined
            }
            onClick={() => setType(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        {GROUPS.map((g) => (
          <TagChip
            key={g}
            label={g === "all" ? "Any status" : GROUP_LABEL[g]}
            active={group === g}
            onClick={() => setGroup(g)}
          />
        ))}
        <input
          type="search"
          className="mc-input"
          style={{ flex: "1 1 220px", maxWidth: 320, marginLeft: "auto" }}
          placeholder="Search name, number or place"
          aria-label="Search applications"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        {isPending ? (
          <CardBody>
            <div className="mc-rows">
              <RowSkeleton count={5} variant="plain" />
            </div>
          </CardBody>
        ) : isError ? (
          <CardBody>
            <EmptyState
              title="Could not load applications"
              text="Try again in a moment."
            />
          </CardBody>
        ) : data.length === 0 ? (
          <CardBody>
            <EmptyState
              title="No applications match"
              text="Try a different status or clear the search."
              actions={
                filtered ? (
                  <button
                    type="button"
                    className="mc-btn-ghost"
                    onClick={clear}
                  >
                    Clear filters
                  </button>
                ) : undefined
              }
            />
          </CardBody>
        ) : (
          <div
            className="mc-rows"
            aria-busy={isPlaceholderData}
            style={{
              opacity: isPlaceholderData ? 0.55 : 1,
              transition: "opacity 0.15s ease",
            }}
          >
            {data.map((r) => (
              <OrgRowItem key={r.key} row={r} />
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

export default function ApplicationsPage() {
  // `useSearchParams` needs a Suspense boundary so the rest of the page can
  // be prerendered.
  return (
    <Suspense fallback={<PlatformPageSkeleton />}>
      <Applications />
    </Suspense>
  );
}

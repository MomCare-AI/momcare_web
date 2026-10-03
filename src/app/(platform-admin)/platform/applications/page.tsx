"use client";

import { useState } from "react";

import { OrgRowItem } from "@/features/platform-admin/components/OrgRowItem";
import { PreviewNotice } from "@/features/platform-admin/components/PreviewNotice";
import { useApplications } from "@/features/platform-admin/hooks/usePlatformAdmin";
import {
  GROUP_LABEL,
  type ApplicationFilters,
  type OrgType,
  type StatusGroup,
} from "@/features/platform-admin/types";
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

export default function ApplicationsPage() {
  const [filters, setFilters] = useState<ApplicationFilters>({
    type: "all",
    group: "all",
    search: "",
  });
  const { data, isPending, isError } = useApplications(filters);
  const set = (patch: Partial<ApplicationFilters>) =>
    setFilters((f) => ({ ...f, ...patch }));

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
            aria-selected={filters.type === t.value}
            className={`mc-tab${filters.type === t.value ? " mc-tab-active" : ""}`}
            style={
              filters.type === t.value
                ? {
                    color: "var(--c-ink)",
                    fontWeight: 700,
                    boxShadow: "inset 0 -2px 0 var(--c-teal)",
                  }
                : undefined
            }
            onClick={() => set({ type: t.value })}
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
            active={filters.group === g}
            onClick={() => set({ group: g })}
          />
        ))}
        <input
          type="search"
          className="mc-input"
          style={{ maxWidth: 280, marginLeft: "auto" }}
          placeholder="Search name, number or place"
          aria-label="Search applications"
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
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
            />
          </CardBody>
        ) : (
          <div className="mc-rows">
            {data.map((r) => (
              <OrgRowItem key={r.key} row={r} />
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

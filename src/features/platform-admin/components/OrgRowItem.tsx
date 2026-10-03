"use client";

import { memo } from "react";
import Link from "next/link";

import { usePrefetchApplication } from "../hooks/usePlatformAdmin";
import type { OrgRow } from "../types";
import { fmtDate } from "./format";
import { StatusBadge, TypeChip } from "./StatusBadge";

/**
 * One organization in a list: links to its review page, and warms that
 * page's data when the row is hovered, focused or touched so opening it is
 * instant. Memoised so typing in a search box does not re-render every row.
 */
export const OrgRowItem = memo(function OrgRowItem({ row }: { row: OrgRow }) {
  const prefetch = usePrefetchApplication();
  const warm = () => void prefetch(row.type, row.id);

  return (
    <Link
      href={`/platform/applications/${row.type}/${row.id}`}
      className="mc-row"
      style={{ textDecoration: "none", color: "inherit" }}
      onMouseEnter={warm}
      onFocus={warm}
      onTouchStart={warm}
    >
      <div className="mc-row-main">
        <div
          className="mc-row-title"
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {row.name}
          <TypeChip type={row.type} />
        </div>
        <div className="mc-row-meta">
          {row.location} · {row.identifier} · Submitted{" "}
          {fmtDate(row.submittedAt)}
        </div>
      </div>
      <StatusBadge group={row.group} label={row.statusLabel} />
    </Link>
  );
});

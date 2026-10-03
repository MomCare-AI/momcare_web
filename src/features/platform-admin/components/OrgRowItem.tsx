import Link from "next/link";

import type { OrgRow } from "../types";
import { fmtDate } from "./format";
import { StatusBadge, TypeChip } from "./StatusBadge";

/** One organization in a list: links to its review page. */
export function OrgRowItem({ row }: { row: OrgRow }) {
  return (
    <Link
      href={`/platform/applications/${row.type}/${row.id}`}
      className="mc-row"
      style={{ textDecoration: "none", color: "inherit" }}
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
}

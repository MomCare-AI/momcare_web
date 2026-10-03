"use client";

import { useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/shared/ui/BackButton";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Pair } from "@/shared/ui/Pair";

import { useDecideHospital, useHospital } from "../hooks/usePlatformAdmin";
import {
  availableHospitalActions,
  HOSPITAL_STATUS_LABEL,
} from "../repositories/platformAdminRepository";
import type { HospitalAction, StatusGroup } from "../types";
import { DecisionModal } from "./DecisionModal";
import { DetailCard } from "./DetailCard";
import { fmtDate, fmtDateTime } from "./format";
import { StatusBadge, TypeChip } from "./StatusBadge";

interface Config {
  label: string;
  title: string;
  subtitle: string;
  fieldLabel: string;
  hint?: string;
  required: boolean;
  confirm: string;
  danger?: boolean;
}

const CONFIG: Record<HospitalAction, Config> = {
  approve: {
    label: "Approve",
    title: "Approve this hospital",
    subtitle: "The owner can sign in and start using MomCare.",
    fieldLabel: "Review note",
    hint: "Optional. Record what you checked: which register, when, and any call made.",
    required: false,
    confirm: "Approve hospital",
  },
  reject: {
    label: "Reject",
    title: "Reject this application",
    subtitle: "The applicant stays locked out and must apply again.",
    fieldLabel: "Reason",
    hint: "Required. This is stored and sent to the applicant.",
    required: true,
    confirm: "Reject application",
    danger: true,
  },
  suspend: {
    label: "Suspend",
    title: "Suspend this hospital",
    subtitle: "Everyone in the hospital loses access immediately.",
    fieldLabel: "Reason",
    hint: "Required. This is stored with the decision.",
    required: true,
    confirm: "Suspend hospital",
    danger: true,
  },
  reactivate: {
    label: "Reactivate",
    title: "Reactivate this hospital",
    subtitle: "Access is restored for the hospital's staff.",
    fieldLabel: "Review note",
    hint: "Optional.",
    required: false,
    confirm: "Reactivate hospital",
  },
};

const GROUP: Record<string, StatusGroup> = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
  suspended: "suspended",
};

export function HospitalReview({ id }: { id: string }) {
  const query = useHospital(id);
  const decide = useDecideHospital(id);
  const [open, setOpen] = useState<HospitalAction | null>(null);
  const h = query.data;

  if (query.isPending) {
    return (
      <div role="status" aria-busy="true">
        <span className="sr-only">Loading…</span>
        <Skeleton className="h-8 w-72" />
        <Skeleton className="mt-6 h-40 w-full" />
        <Skeleton className="mt-4 h-40 w-full" />
      </div>
    );
  }

  if (!h) {
    return (
      <EmptyState
        title="Application not found"
        text="It may have been removed, or the link is wrong."
      />
    );
  }

  const actions = availableHospitalActions(h.status);
  const cfg = open ? CONFIG[open] : null;

  return (
    <>
      <BackButton label="Applications" />
      <div
        style={{
          margin: "14px 0 20px",
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <h1 className="mc-h1">{h.name}</h1>
        <TypeChip type="hospital" />
        <StatusBadge
          group={GROUP[h.status]}
          label={HOSPITAL_STATUS_LABEL[h.status]}
        />
      </div>

      <Card style={{ marginBottom: 16 }}>
        <CardHeader>
          <div className="mc-card-title">Decision</div>
        </CardHeader>
        <CardBody>
          {h.reviewedAt ? (
            <p style={{ margin: "0 0 12px", fontSize: 13.5 }}>
              Last decision: <strong>{HOSPITAL_STATUS_LABEL[h.status]}</strong>{" "}
              by {h.reviewedBy ?? "—"} on {fmtDateTime(h.reviewedAt)}.
              {h.reviewNote && (
                <>
                  <br />
                  <span style={{ color: "var(--c-body)" }}>
                    Note: {h.reviewNote}
                  </span>
                </>
              )}
            </p>
          ) : (
            <p style={{ margin: "0 0 12px", fontSize: 13.5 }}>
              Not reviewed yet. Check the licence against the issuing
              authority&rsquo;s register before approving.
            </p>
          )}
          {actions.length > 0 ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {actions.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={
                    CONFIG[a].danger ? "mc-btn-ghost mc-btn-danger" : "mc-btn"
                  }
                  onClick={() => setOpen(a)}
                >
                  {CONFIG[a].label}
                </button>
              ))}
            </div>
          ) : (
            <span className="mc-hint">
              No further decisions are possible. A rejected applicant must apply
              again.
            </span>
          )}
        </CardBody>
      </Card>

      <DetailCard title="Hospital">
        <Pair label="Name" value={h.name} />
        <Pair label="Licence number" value={h.licenseNumber} />
        <Pair label="Submitted" value={fmtDate(h.submittedAt)} />
        <Pair label="Contact email" value={h.contact.email} />
        <Pair label="Contact phone" value={h.contact.phone} />
      </DetailCard>

      <DetailCard title="Address">
        <Pair
          label="Street"
          value={[h.address.line1, h.address.line2].filter(Boolean).join(", ")}
        />
        <Pair label="City" value={h.address.city} />
        <Pair label="State / province" value={h.address.state} />
        <Pair label="Postal code" value={h.address.postalCode} />
        <Pair label="Country" value={h.address.country} />
      </DetailCard>

      <DetailCard title="Owner">
        <Pair label="Name" value={h.owner.name} />
        <Pair label="Email" value={h.owner.email} />
        <Pair label="Phone" value={h.owner.phone} />
      </DetailCard>

      <DetailCard title="Licence evidence">
        <Pair label="Licence number (self-declared)" value={h.licenseNumber} />
        <Pair
          label="Licence image"
          value="Not uploaded yet (upload is planned)"
        />
      </DetailCard>

      {cfg && open && (
        <DecisionModal
          open
          onClose={() => setOpen(null)}
          title={cfg.title}
          subtitle={cfg.subtitle}
          fieldLabel={cfg.fieldLabel}
          hint={cfg.hint}
          required={cfg.required}
          confirmLabel={cfg.confirm}
          danger={cfg.danger}
          onConfirm={(note) => decide.mutateAsync({ action: open, note })}
        />
      )}
    </>
  );
}

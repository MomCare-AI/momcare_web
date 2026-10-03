"use client";

import { useState } from "react";
import { Eye, EyeOff, FileText } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { formatFileSize } from "@/shared/registration/documents";
import { BackButton } from "@/shared/ui/BackButton";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Pair } from "@/shared/ui/Pair";
import {
  documentLabel,
  REQUIRED_DOCUMENT_TYPES,
  type DocumentStatus,
} from "@/features/ngo-onboarding/types";

import {
  useDecideNgo,
  useDecideNgoDocument,
  useNgo,
  useRequestNgoInfo,
} from "../hooks/usePlatformAdmin";
import {
  availableNgoActions,
  NGO_STATUS_LABEL,
} from "../repositories/platformAdminRepository";
import type { NgoAction, StatusGroup } from "../types";
import { DecisionModal } from "./DecisionModal";
import { DetailCard } from "./DetailCard";
import { fmtDate, fmtDateTime, maskCnic } from "./format";
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

/** `start_review` has no dialog: it is a single click. */
const CONFIG: Record<Exclude<NgoAction, "start_review">, Config> = {
  approve: {
    label: "Verify NGO",
    title: "Verify this NGO",
    subtitle:
      "It will show as “Verified by MomCare”. MomCare then creates the representative’s account.",
    fieldLabel: "Review note",
    hint: "Optional. Record which register you checked, when, and any call made.",
    required: false,
    confirm: "Verify NGO",
  },
  reject: {
    label: "Reject",
    title: "Reject this application",
    subtitle: "The applicant will need to apply again.",
    fieldLabel: "Reason",
    hint: "Required. This is stored with the decision.",
    required: true,
    confirm: "Reject application",
    danger: true,
  },
  suspend: {
    label: "Suspend",
    title: "Suspend this NGO",
    subtitle: "Its access is revoked until it is reactivated.",
    fieldLabel: "Reason",
    hint: "Required. This is stored with the decision.",
    required: true,
    confirm: "Suspend NGO",
    danger: true,
  },
  reactivate: {
    label: "Reactivate",
    title: "Reactivate this NGO",
    subtitle: "Its access is restored.",
    fieldLabel: "Review note",
    hint: "Optional.",
    required: false,
    confirm: "Reactivate NGO",
  },
};

const GROUP: Record<string, StatusGroup> = {
  pending: "pending",
  under_review: "pending",
  verified: "approved",
  rejected: "rejected",
  suspended: "suspended",
};

const DOC_BADGE: Record<DocumentStatus, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "mc-badge mc-badge-medium" },
  verified: { label: "Verified", cls: "mc-badge mc-badge-stable" },
  rejected: { label: "Rejected", cls: "mc-badge mc-badge-critical" },
};

export function NgoReview({ id }: { id: string }) {
  const query = useNgo(id);
  const decide = useDecideNgo(id);
  const decideDoc = useDecideNgoDocument(id);
  const requestInfo = useRequestNgoInfo(id);

  const [dialog, setDialog] = useState<Exclude<
    NgoAction,
    "start_review"
  > | null>(null);
  const [rejectDoc, setRejectDoc] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [showCnic, setShowCnic] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const n = query.data;

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

  if (!n) {
    return (
      <EmptyState
        title="Application not found"
        text="It may have been removed, or the link is wrong."
      />
    );
  }

  const actions = availableNgoActions(n.status);
  const inReview = n.status === "under_review";
  const requiredVerified = REQUIRED_DOCUMENT_TYPES.every((t) =>
    n.documents.some((d) => d.type === t && d.status === "verified")
  );
  const canAskInfo = n.status === "pending" || n.status === "under_review";

  const run = async (fn: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await fn();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  const cfg = dialog ? CONFIG[dialog] : null;

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
        <h1 className="mc-h1">{n.organization.name}</h1>
        <TypeChip type="ngo" />
        <StatusBadge
          group={GROUP[n.status]}
          label={NGO_STATUS_LABEL[n.status]}
        />
      </div>

      {actionError && (
        <div
          className="mc-alert mc-alert-error"
          role="alert"
          style={{ marginBottom: 14 }}
        >
          {actionError}
        </div>
      )}

      <Card style={{ marginBottom: 16 }}>
        <CardHeader>
          <div className="mc-card-title">Decision</div>
        </CardHeader>
        <CardBody>
          <p style={{ margin: "0 0 12px", fontSize: 13.5 }}>
            {n.status === "pending" &&
              "Start the review to check the documents. Uploading a certificate does not verify an NGO: check the registration against the issuing authority yourself."}
            {n.status === "under_review" &&
              "Check each document, then verify or reject the NGO. Both required documents must be verified before you can verify the NGO."}
            {n.status === "verified" && (
              <>
                <strong>✓ Verified by MomCare.</strong> Not a government
                verification.
              </>
            )}
            {(n.status === "rejected" || n.status === "suspended") && (
              <>
                {NGO_STATUS_LABEL[n.status]}
                {n.statusReason && <>: {n.statusReason}</>}
              </>
            )}
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {actions.map((a) =>
              a === "start_review" ? (
                <button
                  key={a}
                  type="button"
                  className="mc-btn"
                  disabled={decide.isPending}
                  onClick={() =>
                    run(() => decide.mutateAsync({ action: a, note: "" }))
                  }
                >
                  Start review
                </button>
              ) : (
                <button
                  key={a}
                  type="button"
                  className={
                    CONFIG[a].danger ? "mc-btn-ghost mc-btn-danger" : "mc-btn"
                  }
                  disabled={a === "approve" && !requiredVerified}
                  onClick={() => setDialog(a)}
                >
                  {CONFIG[a].label}
                </button>
              )
            )}
            {canAskInfo && (
              <button
                type="button"
                className="mc-btn-ghost"
                onClick={() => setInfoOpen(true)}
              >
                Request more information
              </button>
            )}
          </div>
          {inReview && !requiredVerified && (
            <span className="mc-hint">
              Verify the registration certificate and the authorization letter
              to enable &ldquo;Verify NGO&rdquo;.
            </span>
          )}
        </CardBody>
      </Card>

      <DetailCard title="Organization">
        <Pair label="Name" value={n.organization.name} />
        <Pair label="Official email" value={n.organization.email} />
        <Pair label="Official phone" value={n.organization.phone} />
        <Pair label="Website" value={n.organization.website} />
        <Pair label="Province" value={n.organization.province} />
        <Pair label="District" value={n.organization.district} />
        <Pair label="Address" value={n.organization.address} />
        <Pair
          label="Areas of operation"
          value={n.organization.areasOfOperation.join(", ")}
        />
        <Pair label="Submitted" value={fmtDate(n.submittedAt)} />
      </DetailCard>

      <DetailCard title="Registration">
        <Pair label="Registration authority" value={n.legal.authority} />
        <Pair label="Registration type" value={n.legal.type} />
        <Pair label="Registration number" value={n.legal.registrationNumber} />
        <Pair
          label="Registration date"
          value={fmtDate(n.legal.registrationDate)}
        />
        <Pair
          label="Expiry / renewal"
          value={
            n.legal.expiryDate ? fmtDate(n.legal.expiryDate) : "None given"
          }
        />
        <Pair label="NTN / tax number" value={n.legal.ntn} />
      </DetailCard>

      <DetailCard title="Authorized representative">
        <Pair label="Name" value={n.representative.name} />
        <div>
          <div className="mc-pair-label">CNIC</div>
          <div
            className="mc-pair-value"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <span>
              {showCnic
                ? n.representative.cnic
                : maskCnic(n.representative.cnic)}
            </span>
            <button
              type="button"
              className="mc-btn-ghost mc-btn-sm"
              onClick={() => setShowCnic((v) => !v)}
              aria-label={showCnic ? "Hide CNIC" : "Show CNIC"}
            >
              {showCnic ? (
                <EyeOff size={14} aria-hidden />
              ) : (
                <Eye size={14} aria-hidden />
              )}
            </button>
          </div>
        </div>
        <Pair label="Designation" value={n.representative.designation} />
        <Pair label="Email" value={n.representative.email} />
        <Pair label="Phone" value={n.representative.phone} />
      </DetailCard>

      <Card style={{ marginBottom: 16 }}>
        <CardHeader>
          <div>
            <div className="mc-card-title">Documents</div>
            <div className="mc-card-sub">
              File preview is not available in this preview.
            </div>
          </div>
        </CardHeader>
        <div className="mc-rows">
          {n.documents.map((d) => {
            const badge = DOC_BADGE[d.status];
            const required = REQUIRED_DOCUMENT_TYPES.includes(d.type);
            return (
              <div key={d.id} className="mc-row">
                <FileText
                  size={18}
                  aria-hidden
                  style={{ color: "var(--c-faint)" }}
                />
                <div className="mc-row-main">
                  <div className="mc-row-title">
                    {documentLabel(d.type)}
                    {required && (
                      <span
                        className="mc-hint"
                        style={{ display: "inline", marginLeft: 8 }}
                      >
                        required
                      </span>
                    )}
                  </div>
                  <div className="mc-row-meta">
                    {d.fileName} · {formatFileSize(d.sizeBytes)}
                    {d.rejectionReason && <> · Reason: {d.rejectionReason}</>}
                  </div>
                </div>
                <span className={badge.cls}>{badge.label}</span>
                {inReview && (
                  <div
                    className="mc-row-actions"
                    style={{ display: "flex", gap: 8 }}
                  >
                    {d.status !== "verified" && (
                      <button
                        type="button"
                        className="mc-btn mc-btn-sm"
                        disabled={decideDoc.isPending}
                        onClick={() =>
                          run(() =>
                            decideDoc.mutateAsync({
                              documentId: d.id,
                              decision: "verified",
                              reason: "",
                            })
                          )
                        }
                      >
                        Verify
                      </button>
                    )}
                    {d.status !== "rejected" && (
                      <button
                        type="button"
                        className="mc-btn-ghost mc-btn-sm"
                        onClick={() => setRejectDoc(d.id)}
                      >
                        Reject
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {n.infoRequests.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <CardHeader>
            <div className="mc-card-title">Information requests</div>
          </CardHeader>
          <div className="mc-rows">
            {n.infoRequests.map((r) => (
              <div key={r.id} className="mc-row">
                <div className="mc-row-main">
                  <div className="mc-row-title">{r.message}</div>
                  <div className="mc-row-meta">{fmtDateTime(r.at)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {cfg && dialog && (
        <DecisionModal
          open
          onClose={() => setDialog(null)}
          title={cfg.title}
          subtitle={cfg.subtitle}
          fieldLabel={cfg.fieldLabel}
          hint={cfg.hint}
          required={cfg.required}
          confirmLabel={cfg.confirm}
          danger={cfg.danger}
          onConfirm={(note) => decide.mutateAsync({ action: dialog, note })}
        />
      )}

      {rejectDoc && (
        <DecisionModal
          open
          onClose={() => setRejectDoc(null)}
          title="Reject this document"
          subtitle="The applicant is told why, so they can upload a better one."
          fieldLabel="Reason"
          hint="Required."
          required
          confirmLabel="Reject document"
          danger
          onConfirm={(reason) =>
            decideDoc.mutateAsync({
              documentId: rejectDoc,
              decision: "rejected",
              reason,
            })
          }
        />
      )}

      {infoOpen && (
        <DecisionModal
          open
          onClose={() => setInfoOpen(false)}
          title="Request more information"
          subtitle="Preview: the message is recorded but not sent to the applicant yet."
          fieldLabel="What do you need?"
          hint="Be specific, for example which document or detail is missing."
          required
          confirmLabel="Send request"
          onConfirm={(message) => requestInfo.mutateAsync(message)}
        />
      )}
    </>
  );
}

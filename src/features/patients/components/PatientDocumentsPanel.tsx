"use client";

import { AlertTriangle, Download, FileText, Share2 } from "lucide-react";

import { Card, CardBody, CardHeader } from "@/shared/ui/Card";

/**
 * Report generation/download — no backend endpoint exists for this at the
 * patient level (Executive Dashboard's CSV export is hospital-wide, not
 * per-patient), so this is a preview of the screen rather than a working
 * feature. Same precedent as `NoteTemplatesTab.tsx`: visible shell, a
 * permanent "not connected" banner, nothing that pretends to work.
 */
export function PatientDocumentsPanel() {
  return (
    <>
      <p className="mc-alert mc-alert-notice" style={{ marginBottom: 18 }}>
        <AlertTriangle size={15} strokeWidth={2} aria-hidden />
        Not yet connected to a report-generation service — this is a preview of
        the screen. Downloads here don&apos;t produce a real file yet.
      </p>

      <Card style={{ marginBottom: 18 }}>
        <CardHeader>
          <div>
            <div className="mc-card-title">Reading report</div>
            <div className="mc-card-sub">
              Every reading recorded within a date range
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="mc-formgrid" style={{ marginBottom: 14 }}>
            <div>
              <label className="mc-label" htmlFor="doc-range-from">
                From
              </label>
              <input
                id="doc-range-from"
                type="date"
                className="mc-input"
                disabled
              />
            </div>
            <div>
              <label className="mc-label" htmlFor="doc-range-to">
                To
              </label>
              <input
                id="doc-range-to"
                type="date"
                className="mc-input"
                disabled
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="mc-btn" disabled>
              <Download size={15} strokeWidth={2} aria-hidden />
              Download
            </button>
            <button type="button" className="mc-btn-ghost" disabled>
              <Share2 size={15} strokeWidth={2} aria-hidden />
              Share
            </button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <div className="mc-card-title">Monthly activity summary</div>
            <div className="mc-card-sub">
              Contacts logged and time spent for one month
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div style={{ marginBottom: 14, maxWidth: 220 }}>
            <label className="mc-label" htmlFor="doc-month">
              Month
            </label>
            <input id="doc-month" type="month" className="mc-input" disabled />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="mc-btn" disabled>
              <FileText size={15} strokeWidth={2} aria-hidden />
              Download
            </button>
            <button type="button" className="mc-btn-ghost" disabled>
              <Share2 size={15} strokeWidth={2} aria-hidden />
              Share
            </button>
          </div>
        </CardBody>
      </Card>
    </>
  );
}

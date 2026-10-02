"use client";

import { useState } from "react";

import { formatFileSize } from "@/shared/registration/documents";
import { ReviewSection } from "@/shared/registration/ReviewSection";
import type { NgoRegistrationData } from "../schemas";
import { documentLabel, type NgoDocumentInput } from "../types";

interface Props {
  data: Partial<NgoRegistrationData>;
  documents: NgoDocumentInput[];
  /** Jump back to a step (0-based) to edit it. */
  onEdit: (step: number) => void;
  onSubmit: () => void;
}

export default function NgoStep4Review({
  data,
  documents,
  onEdit,
  onSubmit,
}: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const [showError, setShowError] = useState(false);

  return (
    <div>
      <div className="hw-step-head">
        <span className="hw-eyebrow">Step 4 — Review &amp; Submit</span>
        <h1 className="hw-title">Check everything before you submit</h1>
        <p className="hw-desc">
          A MomCare reviewer will verify these details and your documents by
          hand. You can go back and edit any section.
        </p>
      </div>

      <form
        id="hw-step-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!confirmed) {
            setShowError(true);
            return;
          }
          onSubmit();
        }}
      >
        <ReviewSection
          title="Organization"
          onEdit={() => onEdit(0)}
          items={[
            { label: "NGO name", value: data.orgName, wide: true },
            { label: "Official email", value: data.orgEmail },
            { label: "Official phone", value: data.orgPhone },
            { label: "Website", value: data.website },
            { label: "Province", value: data.province },
            { label: "District", value: data.district },
            { label: "Address", value: data.address, wide: true },
            {
              label: "Areas of operation",
              value: data.areasOfOperation?.join(", "),
              wide: true,
            },
          ]}
        />

        <ReviewSection
          title="Registration"
          onEdit={() => onEdit(1)}
          items={[
            {
              label: "Registration authority",
              value: data.authority,
              wide: true,
            },
            { label: "Registration type", value: data.registrationType },
            { label: "Registration number", value: data.registrationNumber },
            { label: "Registration date", value: data.registrationDate },
            { label: "Expiry / renewal date", value: data.expiryDate },
            { label: "NTN / tax number", value: data.ntn },
          ]}
        />

        <ReviewSection
          title="Authorized representative"
          onEdit={() => onEdit(2)}
          items={[
            { label: "Name", value: data.repName },
            { label: "CNIC", value: data.cnic },
            { label: "Designation", value: data.designation },
            { label: "Email", value: data.repEmail },
            { label: "Phone", value: data.repPhone },
          ]}
        />

        <ReviewSection title="Documents" onEdit={() => onEdit(2)}>
          <dl className="hw-review-grid">
            {documents.map((d) => (
              <div key={d.id} className="hw-review-item hw-review-wide">
                <dt>{documentLabel(d.type)}</dt>
                <dd>
                  {d.file.name} · {formatFileSize(d.file.size)} ·{" "}
                  <span className="hw-hint">Ready to submit</span>
                </dd>
              </div>
            ))}
          </dl>
        </ReviewSection>

        <label className="hw-consent">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => {
              setConfirmed(e.target.checked);
              if (e.target.checked) setShowError(false);
            }}
          />
          <span>
            I confirm that the information and documents submitted are accurate
            and belong to this organization.
          </span>
        </label>
        {showError && (
          <span className="hw-err-msg" role="alert">
            Please confirm before submitting.
          </span>
        )}
      </form>
    </div>
  );
}

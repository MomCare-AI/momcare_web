"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { DocumentUpload } from "@/shared/registration/DocumentUpload";
import {
  formatCnic,
  representativeSchema,
  type RepresentativeData,
} from "../schemas";
import {
  DESIGNATIONS,
  DOCUMENT_TYPES,
  REQUIRED_DOCUMENT_TYPES,
  documentLabel,
  type NgoDocumentInput,
  type NgoDocumentType,
} from "../types";

interface Props {
  defaultValues?: Partial<RepresentativeData>;
  documents: NgoDocumentInput[];
  onDocumentsChange: (docs: NgoDocumentInput[]) => void;
  onSubmit: (data: RepresentativeData) => void;
}

const OPTIONAL_TYPES = DOCUMENT_TYPES.filter(
  (d) => !REQUIRED_DOCUMENT_TYPES.includes(d.value)
);

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `doc-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function NgoStep3Representative({
  defaultValues,
  documents,
  onDocumentsChange,
  onSubmit,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RepresentativeData>({
    resolver: zodResolver(representativeSchema),
    defaultValues,
  });
  const [docError, setDocError] = useState<NgoDocumentType[]>([]);
  const [extraType, setExtraType] = useState<NgoDocumentType>(
    OPTIONAL_TYPES[0].value
  );

  const fileFor = (type: NgoDocumentType) =>
    documents.find((d) => d.type === type)?.file ?? null;

  const setRequired = (type: NgoDocumentType, file: File | null) => {
    const rest = documents.filter((d) => d.type !== type);
    onDocumentsChange(file ? [...rest, { id: newId(), type, file }] : rest);
    setDocError((e) => e.filter((t) => t !== type));
  };

  const extras = documents.filter(
    (d) => !REQUIRED_DOCUMENT_TYPES.includes(d.type)
  );

  const submit = (data: RepresentativeData) => {
    const missing = REQUIRED_DOCUMENT_TYPES.filter((t) => !fileFor(t));
    setDocError(missing);
    if (missing.length === 0) onSubmit(data);
  };

  // Format before react-hook-form reads the value, or it would validate (and
  // submit) the raw digits while the box shows the dashed version.
  const cnicField = register("cnic");
  const onCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = formatCnic(e.target.value);
    return cnicField.onChange(e);
  };

  return (
    <div>
      <div className="hw-step-head">
        <span className="hw-eyebrow">
          Step 3 — Representative &amp; Documents
        </span>
        <h1 className="hw-title">Who can act for the organization?</h1>
        <p className="hw-desc">
          The authorized representative is the person MomCare contacts during
          review and who receives the account once you are verified. Uploading a
          document does not verify your NGO on its own — a reviewer checks it by
          hand.
        </p>
      </div>

      <form id="hw-step-form" onSubmit={handleSubmit(submit)} noValidate>
        <div className="hw-section-label">Authorized representative</div>

        <div className="hw-grid-2 hw-mt-lg">
          <div className="hw-field">
            <label className="hw-label" htmlFor="repName">
              Full name <span className="hw-req">*</span>
            </label>
            <input
              {...register("repName")}
              id="repName"
              type="text"
              autoComplete="name"
              className={`hw-input${errors.repName ? " hw-input-err" : ""}`}
            />
            {errors.repName && (
              <span className="hw-err-msg">{errors.repName.message}</span>
            )}
          </div>
          <div className="hw-field">
            <label className="hw-label" htmlFor="cnic">
              CNIC <span className="hw-req">*</span>
            </label>
            <input
              {...cnicField}
              onChange={onCnicChange}
              id="cnic"
              type="text"
              inputMode="numeric"
              maxLength={15}
              placeholder="XXXXX-XXXXXXX-X"
              className={`hw-input${errors.cnic ? " hw-input-err" : ""}`}
            />
            {errors.cnic && (
              <span className="hw-err-msg">{errors.cnic.message}</span>
            )}
          </div>
        </div>

        <div className="hw-field hw-mt-lg">
          <label className="hw-label" htmlFor="designation">
            Designation <span className="hw-req">*</span>
          </label>
          <select
            {...register("designation")}
            id="designation"
            defaultValue=""
            className={`hw-input hw-select${errors.designation ? " hw-input-err" : ""}`}
          >
            <option value="" disabled>
              Select designation
            </option>
            {DESIGNATIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {errors.designation && (
            <span className="hw-err-msg">{errors.designation.message}</span>
          )}
        </div>

        <div className="hw-grid-2 hw-mt-lg">
          <div className="hw-field">
            <label className="hw-label" htmlFor="repEmail">
              Official email <span className="hw-req">*</span>
            </label>
            <input
              {...register("repEmail")}
              id="repEmail"
              type="email"
              autoComplete="email"
              className={`hw-input${errors.repEmail ? " hw-input-err" : ""}`}
            />
            {errors.repEmail && (
              <span className="hw-err-msg">{errors.repEmail.message}</span>
            )}
          </div>
          <div className="hw-field">
            <label className="hw-label" htmlFor="repPhone">
              Phone number <span className="hw-req">*</span>
            </label>
            <input
              {...register("repPhone")}
              id="repPhone"
              type="tel"
              autoComplete="tel"
              className={`hw-input${errors.repPhone ? " hw-input-err" : ""}`}
            />
            {errors.repPhone && (
              <span className="hw-err-msg">{errors.repPhone.message}</span>
            )}
          </div>
        </div>

        <div className="hw-section-label" style={{ marginTop: 28 }}>
          Documents
        </div>

        <div className="hw-mt-lg">
          {REQUIRED_DOCUMENT_TYPES.map((type) => (
            <DocumentUpload
              key={type}
              label={documentLabel(type)}
              required
              file={fileFor(type)}
              onChange={(f) => setRequired(type, f)}
              error={
                docError.includes(type)
                  ? `${documentLabel(type)} is required`
                  : null
              }
            />
          ))}
        </div>

        <div className="hw-mt-lg">
          <div className="hw-field">
            <label className="hw-label" htmlFor="extraType">
              Add a supporting document{" "}
              <span className="hw-opt-tag">optional</span>
            </label>
            <select
              id="extraType"
              value={extraType}
              onChange={(e) => setExtraType(e.target.value as NgoDocumentType)}
              className="hw-input hw-select"
            >
              {OPTIONAL_TYPES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <DocumentUpload
            label={documentLabel(extraType)}
            file={null}
            onChange={(f) =>
              f &&
              onDocumentsChange([
                ...documents,
                { id: newId(), type: extraType, file: f },
              ])
            }
          />
          {extras.map((d) => (
            <DocumentUpload
              key={d.id}
              label={documentLabel(d.type)}
              file={d.file}
              onChange={(f) =>
                f &&
                onDocumentsChange(
                  documents.map((x) => (x.id === d.id ? { ...x, file: f } : x))
                )
              }
              onRemove={() =>
                onDocumentsChange(documents.filter((x) => x.id !== d.id))
              }
            />
          ))}
        </div>
      </form>
    </div>
  );
}

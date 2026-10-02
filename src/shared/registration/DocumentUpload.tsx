"use client";

import { useRef, useState } from "react";

import {
  formatFileSize,
  validateDocumentFile,
  DOCUMENT_ACCEPT,
} from "./documents";

interface Props {
  label: string;
  required?: boolean;
  hint?: string;
  file: File | null;
  onChange: (file: File | null) => void;
  /** Error from the parent (e.g. "required"); local file errors show too. */
  error?: string | null;
  onRemove?: () => void;
}

/**
 * One document slot, styled like the hospital logo upload zone. Rejects files
 * of the wrong type or size before they reach the form's state.
 */
export function DocumentUpload({
  label,
  required,
  hint,
  file,
  onChange,
  error,
  onRemove,
}: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.files?.[0] ?? null;
    e.target.value = ""; // allow re-picking the same file
    if (!next) return;
    const problem = validateDocumentFile(next);
    setLocalError(problem);
    if (!problem) onChange(next);
  };

  const shown = localError ?? error ?? null;

  return (
    <div className="hw-field hw-doc-slot">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <label className="hw-label">
          {label} {required && <span className="hw-req">*</span>}
        </label>
        {onRemove && (
          <button type="button" className="hw-doc-remove" onClick={onRemove}>
            Remove
          </button>
        )}
      </div>
      <button
        type="button"
        className="hw-upload-zone"
        style={{ minHeight: 84 }}
        onClick={() => ref.current?.click()}
        aria-label={
          file ? `${label}: ${file.name}. Change file` : `Upload ${label}`
        }
      >
        {file ? (
          <div className="hw-upload-preview-info">
            <span className="hw-upload-filename">{file.name}</span>
            <span className="hw-upload-sublabel">
              {formatFileSize(file.size)} ·{" "}
              <span className="hw-upload-change-btn">Click to change</span>
            </span>
          </div>
        ) : (
          <div className="hw-upload-empty">
            <div className="hw-upload-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="hw-upload-label">Click to upload</span>
            <span className="hw-upload-sublabel">
              {hint ?? "PDF, JPG or PNG — up to 5 MB"}
            </span>
          </div>
        )}
      </button>
      <input
        ref={ref}
        type="file"
        accept={DOCUMENT_ACCEPT}
        className="hw-file-hidden"
        onChange={pick}
        tabIndex={-1}
        aria-hidden
      />
      {shown && (
        <span className="hw-err-msg" role="alert">
          {shown}
        </span>
      )}
    </div>
  );
}

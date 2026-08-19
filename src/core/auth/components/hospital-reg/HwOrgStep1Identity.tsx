"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef } from "react";
import { orgStep1Schema, type OrgStep1Data } from "./hwSchemas";

interface Props {
  defaultValues?: Partial<OrgStep1Data>;
  initialLogo?: File | null;
  onSubmit: (data: OrgStep1Data, logo: File | null) => void;
  onBack: () => void;
}

export default function HwOrgStep1Identity({
  defaultValues,
  initialLogo,
  onSubmit,
  onBack,
}: Props) {
  const [logo, setLogo] = useState<File | null>(initialLogo ?? null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrgStep1Data>({
    resolver: zodResolver(orgStep1Schema),
    defaultValues,
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setLogo(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  return (
    <div>
      <div className="hw-step-head">
        <span className="hw-eyebrow">Step 2 — Organization Identity</span>
        <h1 className="hw-title">Name your organization</h1>
        <p className="hw-desc">
          The organization is created with{" "}
          <code className="hw-code">is_active = false</code> and goes live only
          after a platform admin approves it. The name is checked against
          existing approved organizations for near-duplicates.
        </p>
      </div>

      <form
        id="hw-step-form"
        onSubmit={handleSubmit((d) => onSubmit(d, logo))}
        noValidate
      >
        <div className="hw-field">
          <label className="hw-label">
            Hospital / organization name <span className="hw-req">*</span>
          </label>
          <input
            {...register("orgName")}
            type="text"
            placeholder="e.g. City General Hospital"
            className={`hw-input hw-input-lg${errors.orgName ? " hw-input-err" : ""}`}
          />
          <span className="hw-hint">
            Checked against existing approved names for near-duplicates.
          </span>
          {errors.orgName && (
            <span className="hw-err-msg">{errors.orgName.message}</span>
          )}
        </div>

        <div className="hw-field hw-mt-lg">
          <button
            type="button"
            className="hw-upload-zone"
            onClick={() => fileRef.current?.click()}
          >
            {preview ? (
              <div className="hw-upload-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Logo preview"
                  className="hw-logo-preview"
                />
                <div className="hw-upload-preview-info">
                  <span className="hw-upload-filename">{logo?.name}</span>
                  <span className="hw-upload-change-btn">Click to change</span>
                </div>
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
                <span className="hw-upload-label">Click to upload logo</span>
                <span className="hw-upload-sublabel">
                  PNG, JPG or SVG — can be added later from settings
                </span>
              </div>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hw-file-hidden"
            onChange={handleFile}
          />
        </div>
      </form>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { step2Schema, type Step2Data } from "./schemas";

function formatCnic(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

function UploadZone({
  label,
  hint,
  file,
  onFile,
}: {
  label: string;
  hint: string;
  file: File | null;
  onFile: (f: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="ob-upload-zone" onClick={() => ref.current?.click()}>
      <input
        ref={ref}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <span className="ob-upload-icon">{file ? "✅" : "📎"}</span>
      <span className="ob-upload-label">{file ? file.name : label}</span>
      <span className="ob-upload-hint">{hint}</span>
    </div>
  );
}

export default function Step2Verification({
  onSubmit,
  onBack,
}: {
  onSubmit: (
    data: Step2Data & { cnicDoc: File | null; pmdcDoc: File | null }
  ) => void;
  onBack: () => void;
}) {
  const [cnicDoc, setCnicDoc] = useState<File | null>(null);
  const [pmdcDoc, setPmdcDoc] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Step2Data>({ resolver: zodResolver(step2Schema) });

  const cnicVal = watch("cnic", "");
  const { ref: cnicRef, ...cnicRest } = register("cnic");

  return (
    <>
      <div className="ob-card-head">
        <motion.div
          className="ob-card-icon"
          initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          🪪
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.18, duration: 0.42, ease: [0.23, 1, 0.32, 1] }}
        >
          <h1 className="ob-card-title">Identity Verification</h1>
          <p className="ob-card-sub">Your credentials, verified securely</p>
        </motion.div>
      </div>

      <form
        className="ob-card-body"
        onSubmit={handleSubmit((d) => onSubmit({ ...d, cnicDoc, pmdcDoc }))}
        noValidate
      >
        <div className="ob-fields">
          <div className="ob-field">
            <label>CNIC Number</label>
            <input
              ref={cnicRef}
              {...cnicRest}
              value={cnicVal}
              placeholder="XXXXX-XXXXXXX-X"
              className={errors.cnic ? "ob-input-error" : ""}
              onChange={(e) =>
                setValue("cnic", formatCnic(e.target.value), {
                  shouldValidate: true,
                })
              }
            />
            {errors.cnic && (
              <span className="ob-field-error">{errors.cnic.message}</span>
            )}
          </div>

          <div className="ob-field">
            <label>PMDC Registration Number</label>
            <input
              placeholder="PMDC-12345"
              className={errors.pmdc ? "ob-input-error" : ""}
              {...register("pmdc")}
            />
            {errors.pmdc && (
              <span className="ob-field-error">{errors.pmdc.message}</span>
            )}
          </div>

          <div className="ob-field">
            <label>Upload CNIC (front &amp; back)</label>
            <UploadZone
              label="Click to upload CNIC"
              hint="PDF, JPG, PNG · max 5MB"
              file={cnicDoc}
              onFile={setCnicDoc}
            />
          </div>

          <div className="ob-field">
            <label>Upload PMDC License</label>
            <UploadZone
              label="Click to upload PMDC license"
              hint="PDF, JPG, PNG · max 5MB"
              file={pmdcDoc}
              onFile={setPmdcDoc}
            />
          </div>

          <div className="ob-note">
            🔒 Documents are encrypted and used only for PMDC verification. They
            are not shared with third parties.
          </div>
        </div>

        <div className="ob-card-foot">
          <motion.button
            type="button"
            className="ob-btn-back"
            onClick={onBack}
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.96 }}
          >
            ← Back
          </motion.button>
          <motion.button
            type="submit"
            className="ob-btn-next"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            Continue <span className="ob-btn-arrow">→</span>
          </motion.button>
        </div>
      </form>
    </>
  );
}

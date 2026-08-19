"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { step3Schema, type Step3Data } from "./schemas";

const SPECIALTIES = [
  { value: "ob-gyn", label: "OB/GYN", icon: "👶" },
  { value: "gp", label: "General Practitioner", icon: "🩺" },
  { value: "midwife", label: "Midwife", icon: "🤱" },
  { value: "pediatrician", label: "Pediatrician", icon: "🧒" },
  { value: "internal-medicine", label: "Internal Medicine", icon: "💊" },
  { value: "family-medicine", label: "Family Medicine", icon: "👨‍👩‍👧" },
  { value: "other", label: "Other", icon: "⚕️" },
];

function UploadZone({
  label,
  file,
  onFile,
}: {
  label: string;
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
      <span className="ob-upload-hint">Optional · PDF, JPG, PNG</span>
    </div>
  );
}

export default function Step3Profile({
  onSubmit,
  onBack,
}: {
  onSubmit: (data: Step3Data & { extraDoc: File | null }) => void;
  onBack: () => void;
}) {
  const [extraDoc, setExtraDoc] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step3Data>({ resolver: zodResolver(step3Schema) });

  return (
    <>
      <div className="ob-card-head">
        <motion.div
          className="ob-card-icon"
          initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          🏥
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.18, duration: 0.42, ease: [0.23, 1, 0.32, 1] }}
        >
          <h1 className="ob-card-title">Professional Profile</h1>
          <p className="ob-card-sub">Tell us about your practice</p>
        </motion.div>
      </div>

      <form
        className="ob-card-body"
        onSubmit={handleSubmit((d) => onSubmit({ ...d, extraDoc }))}
        noValidate
      >
        <div className="ob-fields">
          <div className="ob-field">
            <label>Primary Specialty</label>
            <select
              className={errors.specialty ? "ob-input-error" : ""}
              {...register("specialty")}
            >
              <option value="">Select your specialty</option>
              {SPECIALTIES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.icon} {s.label}
                </option>
              ))}
            </select>
            {errors.specialty && (
              <span className="ob-field-error">{errors.specialty.message}</span>
            )}
          </div>

          <div className="ob-field">
            <label>Associated Hospital / Clinic</label>
            <input
              placeholder="e.g. Shaukat Khanum Memorial Hospital"
              className={errors.hospital ? "ob-input-error" : ""}
              {...register("hospital")}
            />
            {errors.hospital && (
              <span className="ob-field-error">{errors.hospital.message}</span>
            )}
          </div>

          <div className="ob-field">
            <label>
              Additional Document{" "}
              <span className="ob-label-opt">(optional)</span>
            </label>
            <UploadZone
              label="Upload supporting document"
              file={extraDoc}
              onFile={setExtraDoc}
            />
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
            className="ob-btn-submit"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            Submit Application ✓
          </motion.button>
        </div>
      </form>
    </>
  );
}

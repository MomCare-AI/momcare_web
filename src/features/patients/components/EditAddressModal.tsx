"use client";

import { useState } from "react";
import {
  checkAddressLine,
  checkPlace,
  checkPostalCode,
  keepPlace,
  keepText,
  useFieldChecks,
} from "@/shared/lib/validation";
import { AlertCircle, MapPin } from "lucide-react";

import { Modal } from "@/shared/ui/Modal";
import { useUpdatePatient } from "../hooks/usePatients";
import type { PatientDetail } from "../types";

export const ADDRESS_KEYS = [
  "address_line1",
  "address_line2",
  "city",
  "state",
  "postal_code",
  "country",
] as const;

type AddressKey = (typeof ADDRESS_KEYS)[number];
type AddressForm = Record<AddressKey, string>;

const FIELDS: { key: AddressKey; label: string; placeholder?: string }[] = [
  {
    key: "address_line1",
    label: "Address line 1",
    placeholder: "House 12, Street 4",
  },
  {
    key: "address_line2",
    label: "Address line 2",
    placeholder: "Area, e.g. F-7",
  },
  { key: "city", label: "City" },
  { key: "state", label: "State / province" },
  { key: "postal_code", label: "Postal code" },
  { key: "country", label: "Country" },
];

/** The patient's address as one line, or null when none is on file. */
export function formatAddress(
  patient: Partial<Pick<PatientDetail, AddressKey>>
): string | null {
  const parts = ADDRESS_KEYS.map((k) => (patient[k] ?? "").trim()).filter(
    Boolean
  );
  return parts.length ? parts.join(", ") : null;
}

function formFrom(patient: Partial<Pick<PatientDetail, AddressKey>>) {
  return Object.fromEntries(
    ADDRESS_KEYS.map((k) => [k, patient[k] ?? ""])
  ) as AddressForm;
}

/**
 * Correct a patient's postal address. All six fields are kept together: the
 * backend requires every one when a patient is enrolled, so a half-edited
 * address would leave the record worse than before.
 */
/** What may be typed into each address field. */
function filterAddress(key: string, v: string): string {
  if (key === "city" || key === "state" || key === "country")
    return keepPlace(v);
  if (key === "postal_code")
    return v.replace(/[^A-Za-z0-9 -]/g, "").slice(0, 10);
  return keepText(v, 200);
}

export function EditAddressModal({
  open,
  onClose,
  patient,
}: {
  open: boolean;
  onClose: () => void;
  patient: PatientDetail;
}) {
  const update = useUpdatePatient(patient.id);
  const [form, setForm] = useState<AddressForm>(() => formFrom(patient));
  const [error, setError] = useState<string | null>(null);

  // Start from what is on file each time the popup opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm(formFrom(patient));
      setError(null);
    }
  }

  const checks = useFieldChecks(() => ({
    address_line1: checkAddressLine(form.address_line1, "Address line 1"),
    address_line2: checkAddressLine(form.address_line2, "Address line 2"),
    city: checkPlace(form.city, "City"),
    state: checkPlace(form.state, "State / province"),
    postal_code: checkPostalCode(form.postal_code),
    country: checkPlace(form.country, "Country"),
  }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleaned = Object.fromEntries(
      ADDRESS_KEYS.map((k) => [k, form[k].trim()])
    ) as AddressForm;
    const problem = checks.validateAll();
    if (problem) {
      setError(problem);
      return;
    }
    try {
      await update.mutateAsync(cleaned);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save this address."
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit address"
      subtitle={patient.full_name}
      icon={<MapPin size={17} strokeWidth={2} aria-hidden />}
    >
      <form onSubmit={save}>
        <div className="mc-formgrid">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="mc-label" htmlFor={`addr-${f.key}`}>
                {f.label} <span className="mc-req">*</span>
              </label>
              <input
                id={`addr-${f.key}`}
                className="mc-input"
                value={form[f.key]}
                placeholder={f.placeholder}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    [f.key]: filterAddress(f.key, e.target.value),
                  }))
                }
                onBlur={() => checks.touch(f.key)}
              />
              {checks.error(f.key) && (
                <span className="mc-field-error" role="alert">
                  {checks.error(f.key)}
                </span>
              )}
            </div>
          ))}
        </div>

        {error && (
          <p className="mc-alert mc-alert-error" style={{ marginTop: 12 }}>
            <AlertCircle size={14} strokeWidth={2} aria-hidden />
            {error}
          </p>
        )}

        <div className="mc-actions" style={{ marginTop: 16 }}>
          <button type="submit" className="mc-btn" disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save address"}
          </button>
          <button
            type="button"
            className="mc-btn-ghost"
            onClick={onClose}
            disabled={update.isPending}
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

"use client";

import { useState } from "react";
import { AlertCircle, Contact, Save } from "lucide-react";

import { useUpdateSecondaryProvider } from "@/features/secondary-providers/hooks/useSecondaryProviders";
import type {
  SecondaryProvider,
  SecondaryProviderInput,
} from "@/features/secondary-providers/types";
import { Modal } from "@/shared/ui/Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  provider: SecondaryProvider;
}

/** A popup, matching the same Edit-modal pattern already used for Staff/
 *  Locations/Clinical Tags — replacing the old row-expand-to-edit form. */
export function EditProviderModal({ open, onClose, provider }: Props) {
  const updateProvider = useUpdateSecondaryProvider();

  const toForm = (): SecondaryProviderInput => ({
    name: provider.name,
    affiliation: provider.affiliation,
    phone: provider.phone,
    email: provider.email,
  });

  const [form, setForm] = useState<SecondaryProviderInput>(toForm());
  const [error, setError] = useState<string | null>(null);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm(toForm());
      setError(null);
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await updateProvider.mutateAsync({
        providerId: provider.id,
        input: form,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save this provider."
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Provider"
      subtitle="Update this provider's details"
      icon={<Contact size={17} strokeWidth={2} aria-hidden />}
      tinted
    >
      <form onSubmit={submit}>
        <div className="mc-formgrid" style={{ gap: 12, marginBottom: 0 }}>
          <div>
            <label className="mc-label" htmlFor="edit-sp-name">
              Name <span className="mc-req">*</span>
            </label>
            <input
              id="edit-sp-name"
              className="mc-input"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="mc-label" htmlFor="edit-sp-affiliation">
              Affiliation
            </label>
            <input
              id="edit-sp-affiliation"
              className="mc-input"
              value={form.affiliation}
              onChange={(e) =>
                setForm({ ...form, affiliation: e.target.value })
              }
            />
          </div>
          <div>
            <label className="mc-label" htmlFor="edit-sp-phone">
              Phone
            </label>
            <input
              id="edit-sp-phone"
              className="mc-input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="mc-label" htmlFor="edit-sp-email">
              Email
            </label>
            <input
              id="edit-sp-email"
              className="mc-input"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>

        {error && (
          <p className="mc-alert mc-alert-error" style={{ marginTop: 16 }}>
            <AlertCircle size={15} strokeWidth={2} aria-hidden />
            {error}
          </p>
        )}

        <div
          style={{
            background: "var(--c-teal-wash)",
            margin: "20px -20px -20px",
            padding: "14px 20px",
            borderTop: "1px solid var(--c-border-soft)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            type="button"
            className="mc-btn-ghost"
            style={{ marginLeft: "auto" }}
            onClick={onClose}
            disabled={updateProvider.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="mc-btn"
            disabled={updateProvider.isPending}
          >
            <Save size={15} strokeWidth={2} aria-hidden />
            {updateProvider.isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

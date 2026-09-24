"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { useDeleteSecondaryProvider } from "@/features/secondary-providers/hooks/useSecondaryProviders";
import type { SecondaryProvider } from "@/features/secondary-providers/types";
import { ActionMenu, ActionMenuItem } from "@/shared/ui/ActionMenu";
import { Modal } from "@/shared/ui/Modal";
import { EditProviderModal } from "./EditProviderModal";

interface Props {
  provider: SecondaryProvider;
}

/** The trailing Action column — a 3-dot menu (Edit / Remove), matching the
 *  reference platform's own table and the same pattern already used for
 *  Staff/Locations, replacing the old row-expand-to-edit behavior. */
export function ProviderActionMenu({ provider }: Props) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <ActionMenu label="Provider actions">
        <ActionMenuItem
          icon={<Pencil size={13} strokeWidth={2} aria-hidden />}
          label="Edit"
          onClick={() => setShowEdit(true)}
        />
        <ActionMenuItem
          icon={<Trash2 size={13} strokeWidth={2} aria-hidden />}
          label="Remove"
          danger
          onClick={() => setShowDelete(true)}
        />
      </ActionMenu>

      <EditProviderModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        provider={provider}
      />
      <DeleteProviderModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        provider={provider}
      />
    </div>
  );
}

function DeleteProviderModal({
  open,
  onClose,
  provider,
}: {
  open: boolean;
  onClose: () => void;
  provider: SecondaryProvider;
}) {
  const deleteProvider = useDeleteSecondaryProvider();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Remove provider"
      subtitle={provider.name}
    >
      <p className="mc-hint">
        This is a contact-list entry, not a clinical record — removing it just
        clears the reference on any patient who had it linked.
      </p>

      {deleteProvider.isError && (
        <p className="mc-alert mc-alert-error" style={{ marginTop: 12 }}>
          {deleteProvider.error instanceof Error
            ? deleteProvider.error.message
            : "Could not remove this provider."}
        </p>
      )}

      <div
        className="mc-card-foot"
        style={{
          padding: "12px 0 0",
          marginTop: 16,
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
          disabled={deleteProvider.isPending}
        >
          Cancel
        </button>
        <button
          type="button"
          className="mc-btn"
          style={{ background: "var(--c-high)" }}
          disabled={deleteProvider.isPending}
          onClick={() =>
            deleteProvider.mutate(provider.id, { onSuccess: onClose })
          }
        >
          {deleteProvider.isPending ? "Removing…" : "Confirm remove"}
        </button>
      </div>
    </Modal>
  );
}

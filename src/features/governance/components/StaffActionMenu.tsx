"use client";

import { useState } from "react";
import { AlertTriangle, Pencil, Power, UserCheck } from "lucide-react";

import {
  useDeactivateStaff,
  useReactivateStaff,
  useStaffAssignmentStatus,
  type StaffMember,
} from "@/features/staff/hooks/useStaff";
import { ActionMenu, ActionMenuItem } from "@/shared/ui/ActionMenu";
import { Modal } from "@/shared/ui/Modal";
import { EditStaffModal } from "./EditStaffModal";

interface Props {
  member: StaffMember;
}

/**
 * The trailing Action column — a 3-dot menu (Edit / Deactivate or
 * Reactivate) replacing the old row-expand-to-reveal-buttons pattern for
 * this specific action, matching the reference platform's own table.
 * Credentialing (`StaffCredentialsPanel`) still expands from the row itself
 * — a different, self-reported concern from identity/role/employment
 * status, kept as its own surface rather than folded in here.
 */
export function StaffActionMenu({ member }: Props) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const reactivateStaff = useReactivateStaff();

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <ActionMenu label="Staff actions">
        <ActionMenuItem
          icon={<Pencil size={13} strokeWidth={2} aria-hidden />}
          label="Edit"
          onClick={() => setShowEdit(true)}
        />
        {member.is_active ? (
          <ActionMenuItem
            icon={<Power size={13} strokeWidth={2} aria-hidden />}
            label="Deactivate"
            danger
            onClick={() => setShowDeactivate(true)}
          />
        ) : (
          <ActionMenuItem
            icon={<UserCheck size={13} strokeWidth={2} aria-hidden />}
            label={reactivateStaff.isPending ? "Reactivating…" : "Reactivate"}
            disabled={reactivateStaff.isPending}
            onClick={() => reactivateStaff.mutate(member.id)}
          />
        )}
      </ActionMenu>

      <EditStaffModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        member={member}
      />
      <DeactivateStaffModal
        open={showDeactivate}
        onClose={() => setShowDeactivate(false)}
        member={member}
      />
    </div>
  );
}

function DeactivateStaffModal({
  open,
  onClose,
  member,
}: {
  open: boolean;
  onClose: () => void;
  member: StaffMember;
}) {
  const statusQuery = useStaffAssignmentStatus(open ? member.id : null);
  const deactivateStaff = useDeactivateStaff();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Deactivate staff member"
      subtitle={member.full_name || member.email}
    >
      {statusQuery.isPending && (
        <p className="mc-hint">Checking their current patients…</p>
      )}
      {statusQuery.isSuccess && statusQuery.data.has_active_patients && (
        <p className="mc-alert mc-alert-notice" style={{ marginBottom: 12 }}>
          <AlertTriangle size={15} strokeWidth={2} aria-hidden />
          {statusQuery.data.message}
        </p>
      )}
      {statusQuery.isSuccess && !statusQuery.data.has_active_patients && (
        <p className="mc-hint">
          No active patients are currently assigned to them.
        </p>
      )}
      {deactivateStaff.isError && (
        <p className="mc-alert mc-alert-error" style={{ marginTop: 12 }}>
          {deactivateStaff.error instanceof Error
            ? deactivateStaff.error.message
            : "Could not deactivate this person."}
        </p>
      )}

      <div
        className="mc-card-foot"
        style={{
          padding: "16px 0 0",
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
          disabled={deactivateStaff.isPending}
        >
          Cancel
        </button>
        <button
          type="button"
          className="mc-btn"
          style={{ background: "var(--c-high)" }}
          disabled={deactivateStaff.isPending || statusQuery.isPending}
          onClick={() =>
            deactivateStaff.mutate(
              { staffId: member.id },
              { onSuccess: onClose }
            )
          }
        >
          {deactivateStaff.isPending ? "Deactivating…" : "Confirm deactivate"}
        </button>
      </div>
    </Modal>
  );
}

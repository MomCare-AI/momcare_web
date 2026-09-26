"use client";

import { Brain } from "lucide-react";

import { ScoreVitalsForm } from "@/features/monitoring/components/ScoreVitalsForm";
import { Modal } from "@/shared/ui/Modal";

interface Props {
  pregnancyId: string;
  patientName: string;
  open: boolean;
  onClose: () => void;
  onRecorded?: () => void;
}

/**
 * "Add Reading" on the Readings tab now records through the same path as
 * the AI Risk Assessment tab's "Score vitals" card — recording a reading
 * already runs it through the model server-side (`reassess_risk`), so this
 * was always the same action under two different doors. One popup, one
 * scoring path, the result shown right here instead of only on a separate
 * tab.
 */
export function AddReadingModal({
  pregnancyId,
  patientName,
  open,
  onClose,
  onRecorded,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Reading"
      subtitle={`Record vitals for ${patientName} and see what the model makes of them`}
      icon={<Brain size={17} strokeWidth={2} aria-hidden />}
      tinted
    >
      <ScoreVitalsForm
        pregnancyId={pregnancyId}
        patientName={patientName}
        onRecorded={onRecorded}
      />
    </Modal>
  );
}

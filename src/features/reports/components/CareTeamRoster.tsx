"use client";

import { motion } from "motion/react";

import { InitialsAvatar } from "@/shared/ui/InitialsAvatar";
import type { StaffMember } from "@/features/staff/hooks/useStaff";

/**
 * A read-only roster — role, specialty, experience, active/inactive.
 *
 * Deliberately does not show a "patients assigned" column: CareTeamMembership
 * has no hospital-wide bulk endpoint (only nested under one pregnancy at a
 * time — see config/api_router.py), so a real per-staff patient count would
 * mean one request per pregnancy. That's a genuine backend gap, not
 * something to fake or work around from here.
 */
export function CareTeamRoster({ staff }: { staff: StaffMember[] }) {
  return (
    <div className="mc-rows">
      {staff.map((m, index) => (
        <motion.div
          key={m.id}
          className="mc-row"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: Math.min(index, 8) * 0.03 }}
        >
          <InitialsAvatar name={m.full_name || m.email} />
          <div className="mc-row-main">
            <div className="mc-row-title">{m.full_name || m.email}</div>
            <div className="mc-row-meta">
              {[
                m.specialty,
                m.years_of_experience !== null
                  ? `${m.years_of_experience} yr${m.years_of_experience === 1 ? "" : "s"} experience`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ") || "No credentialing details on file"}
            </div>
          </div>
          <span className="mc-badge mc-badge-neutral">{m.role_name}</span>
          {!m.is_user_active && (
            <span className="mc-badge mc-badge-high">Inactive</span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

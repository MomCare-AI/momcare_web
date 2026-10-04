"use client";

import { RiskOverview } from "@/features/risk/components/RiskOverview";
import { usePageTitle } from "@/hooks/usePageTitle";
import { usePortal } from "../layout";

export default function RiskPage() {
  usePageTitle("Risk");
  const { isClinician, isHospitalAdmin } = usePortal();
  // A clinician sees her own patients; a hospital admin sees the roster.
  return <RiskOverview assignedToMe={isClinician && !isHospitalAdmin} />;
}

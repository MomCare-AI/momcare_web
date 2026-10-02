import type { BandStatus } from "../types";

/** Shared label + pill colour for each band status. */
export const BAND_STATUS: Record<BandStatus, { label: string; cls: string }> = {
  in_stock: { label: "In stock", cls: "bg-slate-100 text-slate-700" },
  deployed: { label: "Deployed", cls: "bg-emerald-50 text-emerald-700" },
  offline: { label: "Offline", cls: "bg-amber-50 text-amber-800" },
  low_battery: { label: "Low battery", cls: "bg-amber-50 text-amber-800" },
  recall_pending: {
    label: "Recall requested",
    cls: "bg-orange-50 text-orange-700",
  },
  returned: { label: "Returned", cls: "bg-sky-50 text-sky-700" },
  retired: { label: "Retired", cls: "bg-red-50 text-red-700" },
};

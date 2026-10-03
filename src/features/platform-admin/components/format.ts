export const fmtDate = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export const fmtDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString() : "—";

/** 35202-1234567-1 -> 35202-*******-1, so a screenshot of the page does not carry the full number. */
export const maskCnic = (cnic: string) =>
  /^\d{5}-\d{7}-\d$/.test(cnic)
    ? `${cnic.slice(0, 5)}-*******-${cnic.slice(-1)}`
    : "••••••••";

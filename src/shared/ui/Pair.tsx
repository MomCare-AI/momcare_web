/**
 * A label/value field — the same "field: value" layout repeated across
 * every detail card in the portal (patient details, hospital profile,
 * settings, staff credentials, risk assessment results). Was copy-pasted
 * identically into 6 files; this is a structural extraction of that exact
 * markup, not a redesign.
 */
export function Pair({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <div className="mc-pair-label">{label}</div>
      <div className="mc-pair-value">{value || "—"}</div>
    </div>
  );
}

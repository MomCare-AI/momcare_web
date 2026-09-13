function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * One brand-tinted style for every person, not a hash-based color per
 * name — the color system's own avatar spec (§18): a random palette here
 * would read as decoration competing with the clinical risk colors, which
 * are the only colors on this dashboard actually meant to carry meaning.
 * References the portal's own --c-teal/--c-teal-wash tokens (inherited from
 * wherever this renders in the DOM) rather than a hardcoded hex, so it
 * stays in sync with the brand color automatically.
 */
export function InitialsAvatar({
  name,
  size = 38,
}: {
  name: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--c-teal-wash)",
        color: "var(--c-teal)",
        fontSize: size * 0.38,
        fontWeight: 700,
        flexShrink: 0,
        letterSpacing: "-0.01em",
      }}
    >
      {initialsOf(name)}
    </span>
  );
}

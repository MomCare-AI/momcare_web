// Decorative-only avatar colors, deliberately excluding the clinical risk
// palette (--c-stable/moderate/high/critical) — those mean something on this
// dashboard, and reusing them here would dull that signal.
const TINTS = ["#4361ee", "#4cc9f0", "#f28c82", "#3978b8", "#7c6fda"];

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function tintFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return TINTS[hash % TINTS.length];
}

export function InitialsAvatar({
  name,
  size = 38,
}: {
  name: string;
  size?: number;
}) {
  const tint = tintFor(name || "?");
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
        background: `${tint}1a`,
        color: tint,
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

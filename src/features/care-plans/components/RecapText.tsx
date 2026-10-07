import type { CSSProperties, ReactNode } from "react";

type Tone = "low" | "medium" | "high" | "finding";

const TONES: Record<Tone, CSSProperties> = {
  low: { background: "#dcf5e6", color: "#17663a" },
  medium: { background: "#fdf0cf", color: "#8a5a00" },
  high: { background: "#fde0dd", color: "#a3261b" },
  finding: { background: "#fdf0cf", color: "#8a5a00" },
};

const MARK: CSSProperties = {
  borderRadius: 6,
  padding: "1px 6px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

// Risk shares ("100% high"), readings found in the week, and vital names.
// Plan text is plain text: it is split and rebuilt as React nodes, never
// injected as HTML.
const PATTERN = new RegExp(
  [
    "(\\d+%\\s+(?:low risk|medium|high))",
    "(Hypertensive Crisis|Hypertension|Hypotension|Diabetes|Pre-?diabetes|Anaemia|Anemia|Fever|Hypoxia|Tachycardia|Bradycardia|Severe|Moderate|Elevated|Mild)",
    "(blood pressure|blood glucose|blood sugar|stress score|temperature|hemoglobin|haemoglobin|heart rate|oxygen saturation|SpO2|weight|BMI)",
  ].join("|"),
  "gi"
);

function toneOfShare(share: string): Tone {
  const s = share.toLowerCase();
  if (s.endsWith("high")) return "high";
  if (s.endsWith("medium")) return "medium";
  return "low";
}

/** "How she did last week": risk shares, findings and vitals stand out. */
export function RecapText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of text.matchAll(PATTERN)) {
    const at = m.index ?? 0;
    if (at > last) nodes.push(text.slice(last, at));
    if (m[1]) {
      nodes.push(
        <mark key={key++} style={{ ...MARK, ...TONES[toneOfShare(m[1])] }}>
          {m[1]}
        </mark>
      );
    } else if (m[2]) {
      nodes.push(
        <mark key={key++} style={{ ...MARK, ...TONES.finding }}>
          {m[2]}
        </mark>
      );
    } else {
      nodes.push(<strong key={key++}>{m[3]}</strong>);
    }
    last = at + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}

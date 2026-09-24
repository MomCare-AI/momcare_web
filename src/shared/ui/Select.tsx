"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  disabled?: boolean;
  "aria-label"?: string;
}

/**
 * A custom-styled dropdown, matching the reference platform's own filter
 * fields (teal focus ring, scrollable option list, a check mark on the
 * selected row) — a plain native `<select>` can't be restyled once open,
 * since the browser/OS renders that part, not CSS.
 *
 * First use: the Advance Filter modal's three fields. Built as a shared
 * primitive so it's a straight swap for other `<select className="mc-input">`
 * spots later, not a one-off.
 */
export function Select({
  id,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  "aria-label": ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div
      ref={rootRef}
      style={{ position: "relative" }}
      className="mc-select-root"
    >
      <button
        id={id}
        type="button"
        className="mc-input mc-select-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          textAlign: "left",
          cursor: disabled ? "not-allowed" : "pointer",
          borderColor: open ? "var(--c-teal)" : undefined,
          boxShadow: open ? "0 0 0 3px var(--c-teal-wash)" : undefined,
        }}
      >
        <span style={{ color: selected ? "var(--c-ink)" : "var(--c-faint)" }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={15}
          strokeWidth={2}
          aria-hidden
          style={{
            flexShrink: 0,
            transition: "transform 0.15s ease",
            transform: open ? "rotate(180deg)" : undefined,
            color: "var(--c-faint)",
          }}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="mc-select-list"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 70,
            maxHeight: 220,
            overflowY: "auto",
            background: "var(--c-card)",
            border: "1px solid var(--c-border)",
            borderRadius: "var(--r-control)",
            boxShadow: "var(--shadow-pop)",
            padding: 4,
            margin: 0,
            listStyle: "none",
          }}
        >
          {options.map((o) => (
            <li key={o.value} role="option" aria-selected={o.value === value}>
              <button
                type="button"
                className="mc-select-option"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 10px",
                  border: "none",
                  background:
                    o.value === value ? "var(--c-teal-wash)" : "transparent",
                  color: "var(--c-ink)",
                  borderRadius: "calc(var(--r-control) - 3px)",
                  cursor: "pointer",
                  fontSize: 13.5,
                }}
              >
                {o.label}
                {o.value === value && (
                  <Check
                    size={14}
                    strokeWidth={2.4}
                    aria-hidden
                    style={{ color: "var(--c-teal)", flexShrink: 0 }}
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

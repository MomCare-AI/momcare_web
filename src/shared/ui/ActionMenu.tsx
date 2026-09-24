"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";

interface Props {
  label: string;
  children: ReactNode;
}

/**
 * The 3-dot trigger + dropdown shared by every dense-table Action column
 * (Staff, Locations, Secondary Providers, Clinical Tags). Portals the
 * dropdown to `document.body` with `position: fixed`, computed from the
 * trigger's own bounding rect — a plain `position: absolute` child gets
 * silently clipped invisible by `.mc-dtable-wrap`'s `overflow-x: auto`
 * whenever the table is wide enough to need horizontal scroll (found live:
 * the menu opened in the DOM, just wasn't visible). Fixed positioning
 * inside a portal is immune to any ancestor's overflow.
 */
export function ActionMenu({ label, children }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const place = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (!r) return;
      const menuWidth = menuRef.current?.offsetWidth ?? 160;
      setPos({
        top: r.bottom + 4,
        left: Math.max(
          8,
          Math.min(r.right - menuWidth, window.innerWidth - menuWidth - 8)
        ),
      });
    };
    place();

    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        btnRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="mc-btn-ghost mc-btn-sm"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <MoreVertical size={15} strokeWidth={2} aria-hidden />
      </button>

      {open &&
        pos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              zIndex: 200,
              minWidth: 160,
              background: "var(--c-card)",
              border: "1px solid var(--c-border)",
              borderRadius: "var(--r-control)",
              boxShadow: "var(--shadow-pop)",
              padding: 4,
            }}
          >
            {children}
          </div>,
          // Every `--c-*`/`--r-*`/`--shadow-*` token is declared on
          // `.mc-portal`, not `:root` — a portal straight to `document.body`
          // sits outside that subtree, so the tokens above resolve to
          // nothing and the menu renders as unstyled bare text (found live:
          // the dropdown appeared as plain text bleeding into the table,
          // not a floating card). Portaling inside `.mc-portal` instead
          // still escapes `.mc-dtable-wrap`'s clipping overflow while
          // keeping the token scope intact.
          document.querySelector(".mc-portal") ?? document.body
        )}
    </>
  );
}

export function ActionMenuItem({
  icon,
  label,
  danger,
  disabled,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className="mc-select-option"
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        padding: "8px 10px",
        border: "none",
        background: "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: 13.5,
        color: danger ? "var(--c-high)" : "var(--c-ink)",
        opacity: disabled ? 0.6 : 1,
      }}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

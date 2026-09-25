"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * A back arrow for any child/detail page reached by drilling in from a
 * list (patient detail, and any future nested route) — `router.back()`
 * returns to wherever the user actually came from, including whatever tab
 * or filter state that page was on, which a fixed `href` link can't do.
 */
export function BackButton({
  label = "Back",
  onBeforeBack,
}: {
  label?: string;
  /** Return `false` to block the default `router.back()` — e.g. to show a
   *  confirm/save prompt first and navigate later once that resolves.
   *  Anything else (including no return value) lets navigation proceed. */
  onBeforeBack?: () => boolean | void;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="mc-link"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        font: "inherit",
      }}
      onClick={() => {
        if (onBeforeBack && onBeforeBack() === false) return;
        router.back();
      }}
      aria-label={label}
    >
      <ArrowLeft size={14} strokeWidth={2} aria-hidden />
      {label}
    </button>
  );
}

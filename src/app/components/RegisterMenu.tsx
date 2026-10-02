"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Building2, ChevronDown, HeartHandshake } from "lucide-react";

const ITEMS = [
  {
    href: "/register",
    title: "Hospital",
    hint: "Register your hospital",
    Icon: Building2,
    // Full class strings (not built from parts) so Tailwind can see them.
    row: "hover:bg-blue-50 focus-visible:bg-blue-50",
    chip: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-focus-visible:bg-blue-600 group-focus-visible:text-white",
    titleText: "group-hover:text-blue-700 group-focus-visible:text-blue-700",
    hintText:
      "group-hover:text-blue-600/80 group-focus-visible:text-blue-600/80",
  },
  {
    href: "/register/ngo",
    title: "NGO",
    hint: "Apply for NGO access",
    Icon: HeartHandshake,
    row: "hover:bg-teal-50 focus-visible:bg-teal-50",
    chip: "bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white group-focus-visible:bg-teal-600 group-focus-visible:text-white",
    titleText: "group-hover:text-teal-700 group-focus-visible:text-teal-700",
    hintText:
      "group-hover:text-teal-600/80 group-focus-visible:text-teal-600/80",
  },
];

/**
 * Nav "Register" button with a Hospital / NGO dropdown. Opens on hover or
 * keyboard focus; the button also toggles it on click so touch and keyboard
 * users get the same menu.
 */
export function RegisterMenu() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const openNow = () => {
    cancelClose();
    setOpen(true);
  };
  // A short grace period so crossing the gap to the menu doesn't flicker it shut.
  const closeSoon = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  };

  useEffect(() => cancelClose, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <motion.button
        type="button"
        className="nav-cta"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onFocus={openNow}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
      >
        Register
        <ChevronDown
          size={14}
          aria-hidden
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="Register as"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            style={{ transformOrigin: "top right" }}
            // pt-3 keeps the hover path unbroken between button and card.
            className="absolute right-0 top-full z-50 w-64 pt-3"
          >
            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              {ITEMS.map(({ href, title, hint, Icon, row, chip, ...text }) => (
                <Link
                  key={href}
                  href={href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left no-underline transition-colors duration-200 focus-visible:outline-none ${row}`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${chip}`}
                  >
                    <Icon size={18} aria-hidden />
                  </span>
                  <span>
                    <span
                      className={`block text-sm font-semibold text-slate-900 transition-colors duration-200 ${text.titleText}`}
                    >
                      {title}
                    </span>
                    <span
                      className={`block text-xs text-slate-500 transition-colors duration-200 ${text.hintText}`}
                    >
                      {hint}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

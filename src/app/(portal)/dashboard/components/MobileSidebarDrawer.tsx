"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Sidebar, type SidebarIdentity } from "./Sidebar";
import type { NavItem } from "./SidebarNavItem";

interface Props extends SidebarIdentity {
  open: boolean;
  onClose: () => void;
  navItems: NavItem[];
  pathname: string;
  onSignOut: () => void;
}

/**
 * The off-canvas mobile nav — a true sliding panel with a backdrop,
 * replacing the old dropdown-under-the-header pattern.
 *
 * Closes on: backdrop click, Escape, or picking a destination (the same
 * three ways the old dropdown closed, plus Escape which it never had).
 * Focus moves into the panel on open and returns to whatever opened it on
 * close, so a keyboard user is never dropped onto a page they can't see.
 */
export function MobileSidebarDrawer({
  open,
  onClose,
  navItems,
  pathname,
  onSignOut,
  ...identity
}: Props) {
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;

    openerRef.current = document.activeElement;
    panelRef.current?.querySelector<HTMLElement>("a,button")?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    // A background scrolling under an open drawer is disorienting on touch
    // devices, and can make the drawer itself seem to scroll away.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="mc-sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            className="mc-sidebar-drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Main navigation"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.28, ease: [0.16, 1, 0.3, 1] }
            }
          >
            <Sidebar
              variant="drawer"
              collapsed={false}
              navItems={navItems}
              pathname={pathname}
              onNavigate={onClose}
              onSignOut={onSignOut}
              {...identity}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

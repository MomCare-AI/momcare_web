"use client";

import { Menu, X } from "lucide-react";

interface Props {
  /** Only the mobile tier renders this — desktop and tablet always show the
   *  sidebar itself, so there's nothing for a hamburger to open. */
  showMenuTrigger: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
}

/**
 * Nothing left here on desktop/tablet — account access already lives in
 * the sidebar's own identity block, search was a duplicate of the
 * Patients list's own (more capable) search box, and the alert bell now
 * lives next to Active/Inactive Patients on the Overview page. This is
 * only rendered at all (see `.mc-appheader`'s own CSS) so the mobile menu
 * trigger has somewhere to live — desktop/tablet gets no header bar.
 */
export function AppHeader({ showMenuTrigger, menuOpen, onToggleMenu }: Props) {
  if (!showMenuTrigger) return null;

  return (
    <header className="mc-appheader">
      <button
        id="mc-menu-trigger"
        type="button"
        className="mc-burger"
        onClick={onToggleMenu}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
      >
        {menuOpen ? <X size={19} /> : <Menu size={19} />}
      </button>
    </header>
  );
}

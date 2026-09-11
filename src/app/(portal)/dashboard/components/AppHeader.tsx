"use client";

import Link from "next/link";
import { Menu, Search, X } from "lucide-react";

import { AlertBell } from "@/features/alerts/components/AlertBell";

interface Props {
  /** Only the mobile tier renders this — desktop and tablet always show the
   *  sidebar itself, so there's nothing for a hamburger to open. */
  showMenuTrigger: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  navSearch: string;
  onNavSearchChange: (value: string) => void;
  onSubmitSearch: (event: React.FormEvent) => void;
  initials: string;
}

/**
 * What's left at the top once primary navigation moves into the sidebar:
 * search, the alert bell, and a compact link to the account. Full name and
 * role now live in the sidebar's own identity block — repeating them here
 * would just be the same information twice.
 */
export function AppHeader({
  showMenuTrigger,
  menuOpen,
  onToggleMenu,
  navSearch,
  onNavSearchChange,
  onSubmitSearch,
  initials,
}: Props) {
  return (
    <header className="mc-appheader">
      {showMenuTrigger && (
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
      )}

      <form className="mc-navsearch" onSubmit={onSubmitSearch} role="search">
        <Search size={15} strokeWidth={2} aria-hidden />
        <input
          type="text"
          placeholder="Search patients…"
          value={navSearch}
          onChange={(e) => onNavSearchChange(e.target.value)}
          aria-label="Search patients"
        />
      </form>

      <div className="mc-appheader-right">
        <AlertBell />
        <Link
          href="/dashboard/settings"
          className="mc-avatar mc-appheader-avatar"
          aria-label="Account settings"
        >
          {initials}
        </Link>
      </div>
    </header>
  );
}

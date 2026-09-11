"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, LogOut, Settings } from "lucide-react";

import { SidebarNavItem, type NavItem } from "./SidebarNavItem";

export interface SidebarIdentity {
  /** The hospital's own name — org.name, never hardcoded. */
  orgName: string;
  /** Already formatted by the caller, e.g. "Dr. Ahmed Nawaz" — the "Dr."
   *  prefix is presentational, derived from role_code, not a stored field. */
  userDisplayName: string;
  /** e.g. "Doctor", "Hospital Administrator" — derived from role_code. */
  roleLabel: string;
  initials: string;
}

interface Props extends SidebarIdentity {
  /** Desktop: a permanent column, width driven by `collapsed` (only honoured
   *  at the desktop breakpoint in CSS; the tablet tier forces its own width
   *  regardless). Drawer: the mobile off-canvas panel, always fully expanded
   *  — there is no "collapsed drawer" concept, it is either open or closed. */
  variant: "desktop" | "drawer";
  collapsed: boolean;
  navItems: NavItem[];
  pathname: string;
  onNavigate?: () => void;
  onSignOut: () => void;
  /** Desktop only — the tablet tier and the drawer have no manual toggle,
   *  since at those widths there is nothing for it to change. */
  onToggleCollapse?: () => void;
}

function isItemActive(item: NavItem, pathname: string): boolean {
  // Sub-pages keep their section highlighted — /dashboard/patients/123 should
  // still show Patients as current. Overview matches exactly, or it would
  // light up on every page. Same rule the old top nav used.
  return item.href === "/dashboard"
    ? pathname === item.href
    : pathname.startsWith(item.href);
}

/**
 * The sidebar's actual content — identity, navigation, and the
 * settings/sign-out footer. Rendered twice: once as the permanent desktop
 * column, once inside the mobile drawer's sliding panel. Keeping one
 * implementation means the two can never quietly drift apart.
 */
export function Sidebar({
  variant,
  collapsed,
  orgName,
  userDisplayName,
  roleLabel,
  initials,
  navItems,
  pathname,
  onNavigate,
  onSignOut,
  onToggleCollapse,
}: Props) {
  // The drawer is always full width, so "collapsed" only ever applies to the
  // desktop column — collapsing it here would just hide labels on mobile
  // for no reason.
  const iconOnly = variant === "desktop" && collapsed;

  return (
    <aside
      className="mc-sidebar"
      data-variant={variant}
      data-collapsed={iconOnly}
    >
      <div className="mc-sidebar-brand">
        <span
          className="mc-sidebar-mark"
          title={iconOnly ? orgName : undefined}
        >
          <Image
            src="/icon.png"
            alt="MomCare"
            width={32}
            height={32}
            priority
          />
          {iconOnly && (
            <span className="mc-sidebar-tooltip" role="tooltip">
              {orgName}
            </span>
          )}
        </span>
        {!iconOnly && (
          <span className="mc-sidebar-brandtext">
            <span className="mc-sidebar-brand-momcare">MomCare</span>
            {/* Truncated with the full name on hover/focus — a long hospital
                name must never push the nav below the fold to stay legible. */}
            <span className="mc-sidebar-brand-org" title={orgName}>
              {orgName}
            </span>
          </span>
        )}
      </div>

      {variant === "desktop" && onToggleCollapse && (
        <button
          type="button"
          className="mc-sidebar-collapse-btn"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight size={14} strokeWidth={2.2} aria-hidden />
          ) : (
            <ChevronLeft size={14} strokeWidth={2.2} aria-hidden />
          )}
        </button>
      )}

      <div className="mc-sidebar-divider" />

      <nav className="mc-sidebar-nav" aria-label="Main">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.href}
            item={item}
            active={isItemActive(item, pathname)}
            collapsed={iconOnly}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="mc-sidebar-footer">
        <div className="mc-sidebar-divider" />

        <div
          className="mc-sidebar-identity"
          title={iconOnly ? `${userDisplayName} · ${roleLabel}` : undefined}
        >
          <span className="mc-avatar" aria-hidden>
            {initials}
          </span>
          {!iconOnly && (
            <span className="mc-sidebar-identity-text">
              <span className="mc-sidebar-identity-name">
                {userDisplayName}
              </span>
              <span className="mc-sidebar-identity-role">{roleLabel}</span>
            </span>
          )}
        </div>

        <Link
          href="/dashboard/settings"
          className="mc-sidebar-navitem"
          aria-label={iconOnly ? "Settings" : undefined}
          onClick={onNavigate}
        >
          <span className="mc-sidebar-navitem-icon">
            <Settings size={17} strokeWidth={1.9} aria-hidden />
          </span>
          {!iconOnly && (
            <span className="mc-sidebar-navitem-label">Settings</span>
          )}
          {iconOnly && (
            <span className="mc-sidebar-tooltip" role="tooltip">
              Settings
            </span>
          )}
        </Link>

        <button
          type="button"
          className="mc-sidebar-navitem mc-sidebar-navitem-danger"
          aria-label={iconOnly ? "Sign out" : undefined}
          onClick={onSignOut}
        >
          <span className="mc-sidebar-navitem-icon">
            <LogOut size={17} strokeWidth={1.9} aria-hidden />
          </span>
          {!iconOnly && (
            <span className="mc-sidebar-navitem-label">Logout</span>
          )}
          {iconOnly && (
            <span className="mc-sidebar-tooltip" role="tooltip">
              Logout
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
  clinicalOnly?: boolean;
  adminOnly?: boolean;
}

interface Props {
  item: NavItem;
  active: boolean;
  /** Icon only, label replaced by a hover/focus tooltip — the desktop rail
   *  and the tablet tier both use this, never the mobile drawer. */
  collapsed: boolean;
  onNavigate?: () => void;
}

/**
 * One sidebar link.
 *
 * The tooltip in collapsed mode is a plain CSS-driven span, not a portal or
 * a library — the label is a handful of words, and a real tooltip system
 * would be a lot of new surface for something this small to get wrong on a
 * healthcare screen. `aria-label` carries the same text for anyone who
 * can't see the tooltip at all.
 */
export function SidebarNavItem({ item, active, collapsed, onNavigate }: Props) {
  const { Icon } = item;

  return (
    <Link
      href={item.href}
      className="mc-sidebar-navitem"
      data-active={active}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? item.label : undefined}
      onClick={onNavigate}
    >
      <span className="mc-sidebar-navitem-icon">
        <Icon size={18} strokeWidth={1.9} aria-hidden />
      </span>
      {!collapsed && (
        <span className="mc-sidebar-navitem-label">{item.label}</span>
      )}
      {collapsed && (
        <span className="mc-sidebar-tooltip" role="tooltip">
          {item.label}
        </span>
      )}
    </Link>
  );
}

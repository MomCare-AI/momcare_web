"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Users,
  Watch,
  type LucideIcon,
} from "lucide-react";

import type { NgoSession } from "../types";

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

const NAV: NavItem[] = [
  { href: "/ngo/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/ngo/bands", label: "Bands", Icon: Watch },
  { href: "/ngo/applications", label: "Applications", Icon: ClipboardList },
  { href: "/ngo/beneficiaries", label: "Beneficiaries", Icon: Users },
  { href: "/ngo/programs", label: "Programs", Icon: FolderKanban },
  { href: "/ngo/reports", label: "Reports", Icon: BarChart3 },
  { href: "/ngo/messages", label: "Messages", Icon: MessageSquare },
];

function linkClass(active: boolean, collapsed: boolean) {
  return `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    collapsed ? "justify-center" : ""
  } ${
    active
      ? "bg-white/20 text-white"
      : "text-teal-50 hover:bg-white/10 hover:text-white"
  }`;
}

/**
 * Solid-teal NGO sidebar. `collapsed` shrinks it to an icon rail (desktop);
 * the mobile drawer always renders it expanded.
 */
export function NgoSidebar({
  session,
  pathname,
  collapsed = false,
  onToggleCollapse,
  onNavigate,
  onSignOut,
}: {
  session: NgoSession;
  pathname: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-teal-700 text-white">
      <div
        className={`border-b border-white/15 py-5 ${collapsed ? "px-2" : "px-5"}`}
      >
        <div
          className={`rounded-xl bg-white p-2 ${collapsed ? "mx-auto w-11" : "w-32"}`}
        >
          <Image
            src="/avatars/logo.png"
            alt="MomCare"
            width={256}
            height={171}
            className={`h-auto ${collapsed ? "w-full" : "w-full"}`}
          />
        </div>
        {!collapsed && (
          <>
            <p className="mt-3 text-sm font-semibold">
              {session.organizationName}
            </p>
            <p className="text-xs text-teal-100">NGO Portal</p>
          </>
        )}
      </div>

      <nav
        aria-label="NGO navigation"
        className="flex-1 space-y-1 overflow-y-auto px-3 py-4"
      >
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              title={collapsed ? label : undefined}
              aria-label={collapsed ? label : undefined}
              className={linkClass(active, collapsed)}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={1.9} aria-hidden />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-white/15 px-3 py-4">
        <Link
          href="/ngo/settings"
          onClick={onNavigate}
          title={collapsed ? "Settings" : undefined}
          aria-label={collapsed ? "Settings" : undefined}
          className={linkClass(pathname.startsWith("/ngo/settings"), collapsed)}
        >
          <Settings size={18} strokeWidth={1.9} aria-hidden />
          {!collapsed && "Settings"}
        </Link>
        <div
          className={`flex items-center gap-3 px-3 py-2 ${collapsed ? "justify-center px-0" : ""}`}
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-teal-700"
            aria-hidden
          >
            NA
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {session.displayName}
              </span>
              <span className="block truncate text-xs text-teal-100">
                Demo NGO
              </span>
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onSignOut}
          title={collapsed ? "Sign out" : undefined}
          aria-label={collapsed ? "Sign out" : undefined}
          className={`${linkClass(false, collapsed)} w-full`}
        >
          <LogOut size={18} strokeWidth={1.9} aria-hidden />
          {!collapsed && "Sign out"}
        </button>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`${linkClass(false, collapsed)} w-full`}
          >
            {collapsed ? (
              <ChevronsRight size={18} strokeWidth={1.9} aria-hidden />
            ) : (
              <>
                <ChevronsLeft size={18} strokeWidth={1.9} aria-hidden />
                Collapse
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

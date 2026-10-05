"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
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

// Icons keep the same x-position whether expanded or collapsed (fixed 11px
// padding inside a 40px-wide item), so nothing slides sideways mid-animation.
const ITEM =
  "group relative flex w-full items-center rounded-lg px-[11px] py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70";

function itemClass(active: boolean) {
  return `${ITEM} ${
    active
      ? "bg-white/20 text-white"
      : "text-teal-50 hover:bg-white/10 hover:text-white"
  }`;
}

/** Labels fade and clip in place instead of unmounting, so text never re-wraps. */
function Label({
  collapsed,
  children,
}: {
  collapsed: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      aria-hidden={collapsed}
      className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-300 ease-in-out motion-reduce:transition-none ${
        collapsed ? "ml-0 max-w-0 opacity-0" : "ml-3 max-w-44 opacity-100"
      }`}
    >
      {children}
    </span>
  );
}

function Tooltip({ show, text }: { show: boolean; text: string }) {
  if (!show) return null;
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      {text}
    </span>
  );
}

/**
 * Solid-teal NGO sidebar. `collapsed` shrinks it to an icon rail (desktop);
 * the mobile drawer always renders it expanded.
 */
export function NgoSidebar({
  session,
  pathname,
  collapsed = false,
  onNavigate,
  onSignOut,
}: {
  session: NgoSession;
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-teal-700 text-white">
      <div className="border-b border-white/15 px-3 py-4">
        <div
          className={`relative transition-[width,height] duration-300 ease-in-out motion-reduce:transition-none ${
            collapsed ? "h-10 w-10" : "h-[91px] w-32"
          }`}
        >
          <Image
            src="/avatars/logo.png"
            alt="MomCare"
            width={256}
            height={171}
            // No box behind it: a soft white halo keeps the pink and purple
            // readable on the teal without a white card.
            style={{
              filter:
                "drop-shadow(0 0 1px rgba(255,255,255,0.9)) drop-shadow(0 0 6px rgba(255,255,255,0.45))",
            }}
            className={`absolute left-0 top-1/2 h-auto w-28 -translate-y-1/2 transition-opacity duration-300 motion-reduce:transition-none ${
              collapsed ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            aria-hidden
            className={`absolute inset-0 flex items-center justify-center text-base font-bold text-white transition-opacity duration-300 motion-reduce:transition-none ${
              collapsed ? "opacity-100" : "opacity-0"
            }`}
          >
            M
          </span>
        </div>
        <div
          aria-hidden={collapsed}
          className={`overflow-hidden whitespace-nowrap transition-[max-height,opacity,margin] duration-300 ease-in-out motion-reduce:transition-none ${
            collapsed ? "mt-0 max-h-0 opacity-0" : "mt-3 max-h-12 opacity-100"
          }`}
        >
          <p className="text-sm font-semibold">{session.organizationName}</p>
          <p className="text-xs text-teal-100">NGO Portal</p>
        </div>
      </div>

      <nav
        aria-label="NGO navigation"
        // Collapsed: let tooltips escape the rail. Expanded: scroll on short screens.
        className={`flex-1 space-y-1 px-3 py-4 ${
          collapsed ? "overflow-visible" : "overflow-y-auto"
        }`}
      >
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-label={collapsed ? label : undefined}
              aria-current={active ? "page" : undefined}
              className={itemClass(active)}
            >
              <Icon
                size={18}
                strokeWidth={1.9}
                className="shrink-0"
                aria-hidden
              />
              <Label collapsed={collapsed}>{label}</Label>
              <Tooltip show={collapsed} text={label} />
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-white/15 px-3 py-4">
        <Link
          href="/ngo/settings"
          onClick={onNavigate}
          aria-label={collapsed ? "Settings" : undefined}
          aria-current={
            pathname.startsWith("/ngo/settings") ? "page" : undefined
          }
          className={itemClass(pathname.startsWith("/ngo/settings"))}
        >
          <Settings
            size={18}
            strokeWidth={1.9}
            className="shrink-0"
            aria-hidden
          />
          <Label collapsed={collapsed}>Settings</Label>
          <Tooltip show={collapsed} text="Settings" />
        </Link>

        <div className="flex items-center px-1 py-2">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-teal-700"
            aria-hidden
          >
            NA
          </span>
          <span
            aria-hidden={collapsed}
            className={`min-w-0 overflow-hidden transition-[max-width,opacity,margin] duration-300 ease-in-out motion-reduce:transition-none ${
              collapsed ? "ml-0 max-w-0 opacity-0" : "ml-3 max-w-40 opacity-100"
            }`}
          >
            <span className="block truncate text-sm font-medium">
              {session.displayName}
            </span>
            <span className="block truncate text-xs text-teal-100">
              Demo NGO
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          aria-label={collapsed ? "Sign out" : undefined}
          className={itemClass(false)}
        >
          <LogOut
            size={18}
            strokeWidth={1.9}
            className="shrink-0"
            aria-hidden
          />
          <Label collapsed={collapsed}>Sign out</Label>
          <Tooltip show={collapsed} text="Sign out" />
        </button>
      </div>
    </div>
  );
}

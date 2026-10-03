"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ChevronsLeft,
  ChevronsRight,
  History,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";

import { usePendingCount } from "../hooks/usePlatformAdmin";
import { usePlatformSidebarCollapsed } from "../hooks/useSidebarCollapsed";

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
  /** Only the exact path counts as active (the Overview root). */
  exact?: boolean;
  badge?: "pending";
}

const NAV: NavItem[] = [
  { href: "/platform", label: "Overview", Icon: LayoutDashboard, exact: true },
  {
    href: "/platform/applications",
    label: "Applications",
    Icon: Inbox,
    badge: "pending",
  },
  { href: "/platform/organizations", label: "Organizations", Icon: Building2 },
  { href: "/platform/activity", label: "Activity", Icon: History },
  { href: "/platform/ai-templates", label: "AI templates", Icon: Sparkles },
];

const EASE = "duration-300 ease-in-out motion-reduce:transition-none";

// Icons keep the same x-position expanded or collapsed (fixed 11px padding in
// a 40px item), so nothing slides sideways while the width animates.
const ITEM =
  "group relative flex w-full items-center rounded-lg px-[11px] py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60";

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
      className={`flex-1 overflow-hidden whitespace-nowrap text-left transition-[max-width,opacity,margin] ${EASE} ${
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
      className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      {text}
    </span>
  );
}

function Sidebar({
  collapsed = false,
  userLabel,
  onNavigate,
  onSignOut,
}: {
  collapsed?: boolean;
  userLabel: string;
  onNavigate?: () => void;
  onSignOut: () => void;
}) {
  const pathname = usePathname();
  const pending = usePendingCount().data ?? 0;

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-100">
      <div className="flex items-center gap-3 border-b border-white/10 px-3 py-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
          <ShieldCheck size={19} aria-hidden />
        </span>
        <div
          aria-hidden={collapsed}
          className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] ${EASE} ${
            collapsed ? "max-w-0 opacity-0" : "max-w-40 opacity-100"
          }`}
        >
          <p className="text-sm font-semibold leading-tight">MomCare</p>
          <p className="text-xs text-slate-400">Platform Admin</p>
        </div>
      </div>

      <nav
        aria-label="Platform admin"
        // Collapsed: let tooltips escape the rail. Expanded: scroll on short screens.
        className={`flex-1 space-y-1 px-3 py-4 ${
          collapsed ? "overflow-visible" : "overflow-y-auto"
        }`}
      >
        {NAV.map(({ href, label, Icon, exact, badge }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          const count = badge === "pending" ? pending : 0;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              aria-label={
                collapsed
                  ? count > 0
                    ? `${label}, ${count} pending`
                    : label
                  : undefined
              }
              className={`${ITEM} ${
                active
                  ? "bg-white/15 text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="relative shrink-0">
                <Icon size={18} strokeWidth={1.9} aria-hidden />
                {collapsed && count > 0 && (
                  <span
                    aria-hidden
                    className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-slate-900"
                  />
                )}
              </span>
              <Label collapsed={collapsed}>{label}</Label>
              {!collapsed && count > 0 && (
                <span
                  className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-slate-900"
                  aria-label={`${count} pending`}
                >
                  {count}
                </span>
              )}
              <Tooltip show={collapsed} text={label} />
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <p
          aria-hidden={collapsed}
          className={`overflow-hidden truncate text-xs text-slate-400 transition-[max-height,opacity,margin] ${EASE} ${
            collapsed ? "mb-0 max-h-0 opacity-0" : "mb-2 max-h-6 opacity-100"
          }`}
        >
          {userLabel}
        </p>
        <button
          type="button"
          onClick={onSignOut}
          aria-label={collapsed ? "Sign out" : undefined}
          className={`${ITEM} text-slate-300 hover:bg-white/10 hover:text-white`}
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

/**
 * The Platform Admin chrome: its own sidebar (collapsible on desktop, a
 * drawer on small screens), separate from the hospital and NGO portals.
 */
export function PlatformShell({
  userLabel,
  onSignOut,
  children,
}: {
  userLabel: string;
  onSignOut: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = usePlatformSidebarCollapsed();

  // Ctrl/Cmd+B toggles the sidebar, as in most editors and admin tools.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setCollapsed(!collapsed);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [collapsed, setCollapsed]);

  // Mobile drawer: Esc closes it, and the page behind it does not scroll.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggleLabel = collapsed ? "Expand sidebar" : "Collapse sidebar";

  return (
    <div className="flex min-h-screen w-full">
      <aside
        className={`sticky top-0 z-30 hidden h-screen shrink-0 transition-[width] will-change-[width] md:block ${EASE} ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <Sidebar
          collapsed={collapsed}
          userLabel={userLabel}
          onSignOut={onSignOut}
        />
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={toggleLabel}
          aria-expanded={!collapsed}
          title={`${toggleLabel} (Ctrl+B)`}
          className="absolute -right-3 top-6 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-white text-slate-700 shadow transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
        >
          {collapsed ? (
            <ChevronsRight size={14} aria-hidden />
          ) : (
            <ChevronsLeft size={14} aria-hidden />
          )}
        </button>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="mc-btn-ghost"
            style={{ padding: 7 }}
          >
            <Menu size={18} aria-hidden />
          </button>
          <strong className="text-sm">MomCare Platform Admin</strong>
        </header>

        <main className="pa-main">{children}</main>
      </div>

      {/* Mobile drawer: always mounted so it can slide; inert while shut. */}
      <div
        className={`fixed inset-0 z-40 md:hidden ${open ? "" : "pointer-events-none"}`}
        inert={!open}
      >
        <div
          className={`absolute inset-0 bg-slate-900/50 transition-opacity ${EASE} ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
          aria-hidden
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={`absolute inset-y-0 left-0 w-64 shadow-xl transition-transform ${EASE} ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="absolute right-2 top-2 z-10 rounded-lg p-1.5 text-slate-300 hover:bg-white/10"
          >
            <X size={18} aria-hidden />
          </button>
          <Sidebar
            userLabel={userLabel}
            onNavigate={() => setOpen(false)}
            onSignOut={onSignOut}
          />
        </div>
      </div>
    </div>
  );
}

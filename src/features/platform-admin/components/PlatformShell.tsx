"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
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

function Sidebar({
  userLabel,
  onNavigate,
  onSignOut,
}: {
  userLabel: string;
  onNavigate?: () => void;
  onSignOut: () => void;
}) {
  const pathname = usePathname();
  const pending = usePendingCount().data ?? 0;

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-100">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
          <ShieldCheck size={19} aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold leading-tight">MomCare</p>
          <p className="text-xs text-slate-400">Platform Admin</p>
        </div>
      </div>

      <nav aria-label="Platform admin" className="flex-1 space-y-1 px-3 py-4">
        {NAV.map(({ href, label, Icon, exact, badge }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                active
                  ? "bg-white/15 text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={18} strokeWidth={1.9} aria-hidden />
              <span className="flex-1">{label}</span>
              {badge === "pending" && pending > 0 && (
                <span
                  className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-slate-900"
                  aria-label={`${pending} pending`}
                >
                  {pending}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <p className="truncate text-xs text-slate-400">{userLabel}</p>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <LogOut size={18} strokeWidth={1.9} aria-hidden />
          Sign out
        </button>
      </div>
    </div>
  );
}

/** The Platform Admin chrome: its own sidebar (drawer on small screens), separate from the hospital and NGO portals. */
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

  return (
    <div style={{ display: "flex", width: "100%", minHeight: "100vh" }}>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 md:block">
        <Sidebar userLabel={userLabel} onSignOut={onSignOut} />
      </aside>

      <div style={{ flex: 1, minWidth: 0 }}>
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

        <main className="mc-page">{children}</main>
      </div>

      {/* Mobile drawer: always mounted so it can slide; inert while shut. */}
      <div
        className={`fixed inset-0 z-40 md:hidden ${open ? "" : "pointer-events-none"}`}
        inert={!open}
      >
        <div
          className={`absolute inset-0 bg-slate-900/50 transition-opacity duration-300 motion-reduce:transition-none ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
          aria-hidden
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={`absolute inset-y-0 left-0 w-64 shadow-xl transition-transform duration-300 ease-in-out motion-reduce:transition-none ${
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

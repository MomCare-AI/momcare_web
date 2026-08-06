'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HeartPulse, Bell, PanelLeftClose, PanelLeft, Search, LogOut } from 'lucide-react'
import NavItem, { type NavItemConfig } from './NavItem'
import { createClient } from '@/lib/supabase/client'

type PortalName = 'Doctor Portal' | 'NGO Portal' | 'Admin Console'

export default function AppShell({
  portalName,
  navItems,
  children,
}: {
  portalName: PortalName
  navItems: NavItemConfig[]
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    // Clear the role cookie by calling our session endpoint with DELETE, or just redirect
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* ───── Sidebar ───── */}
      <aside
        className={`hidden flex-shrink-0 flex-col border-r border-line bg-panel transition-[width] duration-200 md:flex ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Logo + portal name */}
        <div className="flex h-16 items-center gap-2 border-b border-line px-4">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-marigold)]">
            <HeartPulse size={14} color="#08332C" strokeWidth={2.5} aria-hidden />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-wide text-pine">MomCare</p>
              <p className="truncate text-[10px] text-ink-muted">{portalName}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
          {navItems.map((item) => (
            <NavItem key={item.href} item={item} collapsed={collapsed} />
          ))}
        </nav>

        {/* Footer: collapse toggle + sign out */}
        <div className="border-t border-line p-2">
          {!collapsed && (
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-muted transition-colors duration-150 hover:bg-pine-wash/60 hover:text-pine disabled:opacity-50"
            >
              <LogOut size={18} strokeWidth={1.75} aria-hidden />
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="flex w-full items-center justify-center rounded-lg px-2.5 py-2 text-ink-muted transition-colors duration-150 hover:bg-pine-wash/60 hover:text-pine"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeft size={18} strokeWidth={1.75} />
            ) : (
              <PanelLeftClose size={18} strokeWidth={1.75} />
            )}
          </button>
        </div>
      </aside>

      {/* ───── Main column ───── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-line bg-panel px-6">
          <div className="flex-1">
            <div className="relative max-w-md">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
                aria-hidden
              />
              <input
                type="text"
                placeholder="Search patients… (Cmd+K)"
                className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-sm text-ink outline-none transition-colors duration-150 placeholder:text-ink-muted focus:border-pine"
              />
            </div>
          </div>
          <button
            className="relative rounded-lg p-2 text-ink-muted transition-colors duration-150 hover:bg-pine-wash hover:text-pine"
            aria-label="View notifications"
          >
            <Bell size={18} strokeWidth={1.75} />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  )
}

'use client'

import AppShell from '@/components/layout/AppShell'
import { LayoutDashboard, UsersRound, SlidersHorizontal, Activity, ScrollText } from 'lucide-react'
import type { NavItemConfig } from '@/components/layout/NavItem'

const NAV_ITEMS: NavItemConfig[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'User Management', href: '/admin/users', icon: UsersRound },
  { label: 'Thresholds', href: '/admin/thresholds', icon: SlidersHorizontal },
  { label: 'Monitoring', href: '/admin/monitoring', icon: Activity },
  { label: 'Audit Log', href: '/admin/audit', icon: ScrollText },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell portalName="Admin Console" navItems={NAV_ITEMS}>
      {children}
    </AppShell>
  )
}

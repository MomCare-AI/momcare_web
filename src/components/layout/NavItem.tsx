'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'

export type NavItemConfig = {
  label: string
  href: string
  icon: LucideIcon
  badge?: number
}

export default function NavItem({
  item,
  collapsed,
}: {
  item: NavItemConfig
  collapsed: boolean
}) {
  const pathname = usePathname()
  // Active if exact match or if current path starts with the item href
  // (but not for the root portal path, to avoid the dashboard matching everything)
  const isActive =
    pathname === item.href ||
    (item.href.split('/').length > 2 && pathname.startsWith(item.href))

  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-150 ${
        isActive
          ? 'bg-pine-wash text-pine'
          : 'text-ink-muted hover:bg-pine-wash/60 hover:text-pine'
      } ${collapsed ? 'justify-center' : ''}`}
      title={collapsed ? item.label : undefined}
      aria-current={isActive ? 'page' : undefined}
    >
      <item.icon size={18} strokeWidth={1.75} aria-hidden />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge != null && item.badge > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-clay)] px-1 text-[10px] font-semibold tabular-nums text-surface">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
        </>
      )}
      {collapsed && item.badge != null && item.badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-clay)] px-0.5 text-[9px] font-bold tabular-nums text-surface">
          {item.badge > 99 ? '!' : item.badge}
        </span>
      )}
    </Link>
  )
}

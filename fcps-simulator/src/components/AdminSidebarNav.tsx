'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Icon from '@/design-system/Icon'
import type { IconName } from '@/design-system/icon-registry'

const ADMIN_NAV_ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: '/admin', label: 'Dashboard', icon: 'analytics' },
  { href: '/admin/analytics', label: 'Analytics', icon: 'trendUp' },
  { href: '/admin/users', label: 'Users', icon: 'community' },
  { href: '/admin/questions', label: 'Questions', icon: 'practice' },
  { href: '/admin/income', label: 'Income', icon: 'wallet' },
  { href: '/admin/settings/payment', label: 'Payment Settings', icon: 'billing' },
]

/**
 * AdminSidebarNav
 * -----------------------------------------------------------------------------
 * Client component so it can read the current pathname and highlight the
 * active tab -- the admin nav previously had no active-state at all. Reuses
 * the same `.sidebar-link` / `.sidebar-link.active` CSS classes as the
 * student Sidebar (globals.css) so every nav tab across the app -- student
 * and admin alike -- shares one consistent bordered-card look, with the
 * active tab getting the pulsing flash-glow border.
 */
export default function AdminSidebarNav() {
  const pathname = usePathname()

  return (
    <nav style={{ flex: 1, padding: '14px 0' }}>
      {ADMIN_NAV_ITEMS.map((item) => {
        // "/admin" itself must match exactly, otherwise it would stay
        // highlighted on every /admin/* sub-page too.
        const isActive =
          item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon name={item.icon} size="md" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

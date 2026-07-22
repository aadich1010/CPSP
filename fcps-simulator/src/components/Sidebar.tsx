'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/auth/actions'

const NAV_ITEMS = [
  { href: '/dashboard',          icon: '🏠', label: 'Dashboard' },
  { href: '/exam/setup',         icon: '📝', label: 'Start Exam' },
  { href: '/dashboard/history',  icon: '📋', label: 'Exam History' },
  { href: '/dashboard/analysis', icon: '📊', label: 'Performance' },
]

interface SidebarProps {
  profile: {
    full_name?: string | null
    email?: string | null
    role?: string | null
    subscription_status?: string | null
    subscription_expires_at?: string | null
  }
  daysLeft: number | null
}

export default function Sidebar({ profile, daysLeft }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [lastPathname, setLastPathname] = useState(pathname)

  // Close the mobile drawer whenever the route changes (i.e. after
  // tapping a nav link). Adjusting state during render instead of in a
  // useEffect, per https://react.dev/learn/you-might-not-need-an-effect
  // -- avoids an extra render pass and the cascading-setState-in-effect
  // lint warning.
  if (pathname !== lastPathname) {
    setLastPathname(pathname)
    setMobileOpen(false)
  }

  const initials = (profile.full_name || profile.email || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <>
      <button
        className="mobile-menu-toggle"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      <div
        className={`sidebar-backdrop ${mobileOpen ? 'visible' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`sidebar shadow-lg ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Logo Section */}
      <div className="p-6 border-b border-teal-500/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-[14px] font-black text-slate-900 leading-tight uppercase tracking-tight">
              FCPS Simulator
            </div>
            <div className="text-[9px] font-bold text-teal-600 uppercase tracking-widest">
              Part 1 CBT
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 space-y-1">
        <div className="px-6 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Main Menu
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-semibold">{item.label}</span>
            </Link>
          )
        })}

        {profile.role === 'admin' && (
          <div className="mt-8">
            <div className="px-6 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Admin Control
            </div>
            <Link
              href="/admin"
              className={`sidebar-link ${pathname.startsWith('/admin') ? 'active' : ''}`}
            >
              <span className="text-lg">⚙️</span>
              <span className="font-semibold">Administration</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Subscription Status Card */}
      {daysLeft !== null && (
        <div className="px-4 mb-4">
          <div
            className={`rounded-xl p-4 border ${
              daysLeft <= 7 
                ? 'bg-amber-50 border-amber-200 text-amber-800' 
                : 'bg-teal-50 border-teal-100 text-teal-800'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">
                {daysLeft <= 7 ? '⚠️ Expiring Soon' : '✅ Active Status'}
              </span>
            </div>
            <div className="text-xs font-medium">
              {daysLeft} days remaining
            </div>
          </div>
        </div>
      )}

      {/* User Identity Section */}
      <div className="p-4 bg-slate-50 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center text-white text-xs font-black">
            {initials}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-bold text-slate-900 truncate">
              {profile.full_name || 'User'}
            </div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {profile.role === 'admin' ? '👑 Admin' : '🎓 Candidate'}
            </div>
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="btn btn-ghost !border-slate-200 !text-slate-600 btn-full btn-sm !py-2"
          >
            Sign Out
          </button>
        </form>
      </div>
      </aside>
    </>
  )
}

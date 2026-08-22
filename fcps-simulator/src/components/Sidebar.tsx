'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/auth/actions'
import VvipWelcomeModal from './vvip/VvipWelcomeModal'
import { isPaidMember } from '@/lib/subscription'
import Icon from '@/design-system/Icon';
import type { IconName } from '@/design-system/icon-registry';
import BrandMark from './BrandMark'

const NAV_ITEMS = [
  { href: '/dashboard',          icon: 'dashboard', label: 'Dashboard' },
  { href: '/exam/setup',         icon: 'practice', label: 'Start Exam' },
  { href: '/dashboard/history',  icon: 'mockExam', label: 'Exam History' },
  { href: '/dashboard/analysis', icon: 'analytics', label: 'Performance' },
]

/** Same 5 destinations as the "Quick Actions" toolbar on the dashboard page
 *  itself (src/app/dashboard/page.tsx) -- this sidebar entry is an
 *  additional, faster way to reach them, not a replacement, so the
 *  dashboard toolbar stays exactly as it was. */
const QUICK_ACTION_ITEMS = [
  { href: '/exam/setup',         icon: 'practice',  label: 'Start Mock Exam' },
  { href: '/dashboard/analysis', icon: 'analytics', label: 'Analysis' },
  { href: '/dashboard/history',  icon: 'mockExam',  label: 'History' },
  { href: '/dashboard/recent',   icon: 'practice',  label: 'Recent Exams' },
  { href: '/dashboard/weak',     icon: 'warning',   label: 'Weak Subjects' },
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
  /** The candidate's own target exam (exam_types.display_name), e.g.
   *  "MS / MD (JCAT)" or "MRCP Part 1" -- see supabase/migrations/
   *  20260822000000_multi_exam_platform_foundation.sql. Defaults to
   *  'FCPS Part 1' for every pre-existing account (target_exam_type_id
   *  null) and anyone who registered for FCPS, so the sidebar keeps
   *  showing exactly what it always has for them. */
  examName?: string
}

export default function Sidebar({ profile, daysLeft, examName = 'FCPS Part 1' }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [lastPathname, setLastPathname] = useState(pathname)
  const [showBye, setShowBye] = useState(false)
  const [quickActionsOpen, setQuickActionsOpen] = useState(false)
  const isPaid = isPaidMember(profile)

  // Paid accounts get a 3s "goodbye" popup (with the same confetti/balloon
  // fx as the welcome ones) before actually signing out -- logout() only
  // runs once the popup's own timer closes it, in onClose below. Demo/admin
  // accounts sign out instantly, same as before this feature existed.
  function handleSignOutClick() {
    if (!isPaid) { void logout(); return }
    setShowBye(true)
  }

  // Close the mobile drawer whenever the route changes (i.e. after
  // tapping a nav link). Adjusting state during render instead of in a
  // useEffect, per https://react.dev/learn/you-might-not-need-an-effect
  // -- avoids an extra render pass and the cascading-setState-in-effect
  // lint warning.
  if (pathname !== lastPathname) {
    setLastPathname(pathname)
    setMobileOpen(false)
    setQuickActionsOpen(false)
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
      <div className="p-2 md:p-6 border-b border-emerald-500/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
            <BrandMark size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] md:text-[14px] font-black text-slate-900 leading-tight uppercase tracking-tight truncate">
              {examName}
            </div>
            <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
              Exam Simulator
            </div>
          </div>
        </div>
      </div>

      {/* Navigation. flex-1 (the "stretch to fill the sidebar" behaviour)
          is DESKTOP-ONLY (md:flex-1) -- that's what pins the footer
          sections (Unlock CTA, myResidency link, subscription card,
          account/Sign Out) to the bottom of the desktop sidebar's tall
          min-height:100vh column. On mobile, nav sizes to its own content
          instead: forcing it to stretch on a short viewport was creating a
          large empty gap between "Quick Actions" and the footer, and that
          empty scrollable area is what rendered as a stray overscroll bar
          on some Android browsers. Sized to content, the whole drawer
          naturally comes out well under one screen's height with room to
          spare, so nothing needs to scroll or stretch at all. */}
      <nav className="md:flex-1 py-2 md:py-6 space-y-1">
        <div className="px-6 mb-1 md:mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
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
              <Icon name={item.icon as IconName} size="lg" />
              <span className="font-semibold">{item.label}</span>
            </Link>
          )
        })}

        {/* Quick Actions -- hover (or tap, for touch/mobile) to open a
            sub-list of the same 5 shortcuts as the dashboard page's own
            Quick Actions toolbar. Clicking a sub-item navigates straight
            there. */}
        <div
          className="relative"
          onMouseEnter={() => setQuickActionsOpen(true)}
          onMouseLeave={() => setQuickActionsOpen(false)}
        >
          <button
            type="button"
            onClick={() => setQuickActionsOpen((v) => !v)}
            aria-expanded={quickActionsOpen}
            className={`sidebar-link w-full ${quickActionsOpen ? 'active' : ''}`}
          >
            <Icon name="bolt" size="lg" />
            <span className="font-semibold flex-1 text-left">Quick Actions</span>
            <span
              className="text-[10px] transition-transform"
              style={{ transform: quickActionsOpen ? 'rotate(180deg)' : 'none' }}
            >
              ▾
            </span>
          </button>

          {quickActionsOpen && (
            <div className="pl-4 pr-2 py-1 space-y-0.5">
              {QUICK_ACTION_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setQuickActionsOpen(false)}
                  className={`sidebar-link ${pathname.startsWith(item.href) ? 'active' : ''}`}
                  style={{ padding: '6px 12px', fontSize: '0.8em' }}
                >
                  <Icon name={item.icon as IconName} size="sm" />
                  <span className="font-semibold">{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {profile.role === 'admin' && (
          <div className="mt-4 md:mt-8">
            <div className="px-6 mb-1 md:mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Admin Control
            </div>
            <Link
              href="/admin"
              className={`sidebar-link ${pathname.startsWith('/admin') ? 'active' : ''}`}
            >
              <span className="text-lg"><Icon name="settings" /></span>
              <span className="font-semibold">Administration</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Unlock Full Access CTA -- links to the Elite pricing plans on the
          landing page so the user can pick a plan and pay. Not shown to
          admins, who already have full access to everything.
          NOTE: this used to reference a "unlock-cta" class that was never
          actually defined anywhere in globals.css -- with no background at
          all, white text on white rendered as a blank, invisible box (the
          "empty white rectangle" visible in every mobile screenshot this
          whole thread). Using the same emerald/teal gradient as every
          other primary CTA in the app (e.g. VvipUpgradeBanner's own
          "Unlock Full Access" button) instead of a phantom custom class. */}
      {profile.role !== 'admin' && (
        <div className="px-4 mb-1 md:mb-4 flex-shrink-0">
          <Link
            href="/#pricing"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-1.5 md:py-3 text-[12px] font-black uppercase tracking-wider text-white shadow-md transition hover:scale-[1.02]"
          >
            <span className="text-base"><Icon name="unlocked" /></span>
            Unlock Full Access
          </Link>
        </div>
      )}

      {/* myResidency website -- opens in a new tab so an in-progress exam
          session or dashboard view is never lost by navigating away. */}
      <div className="px-4 mb-1 md:mb-4 flex-shrink-0">
        <a
          href="https://myresidency.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost btn-full flex items-center justify-center gap-2"
          style={{ fontSize: '0.72rem', fontWeight: 700, padding: '6px 12px', minHeight: 'unset' }}
        >
          <Icon name="external" size="sm" />
          myResidency Website
        </a>
      </div>

      {/* Subscription Status Card */}
      {daysLeft !== null && (
        <div className="px-4 mb-1 md:mb-4 flex-shrink-0">
          <div
            className={`rounded-xl p-1.5 md:p-4 border ${
              daysLeft <= 7
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-emerald-50 border-emerald-100 text-emerald-800'
            }`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">
                {daysLeft <= 7 ? <><Icon name="warning" size="xs" /> Expiring Soon</> : <><Icon name="correct" size="xs" /> Active Status</>}
              </span>
              <span className="text-[10px] md:text-xs font-medium">
                · {daysLeft} days remaining
              </span>
            </div>
          </div>
        </div>
      )}

      {/* User Identity Section */}
      <div className="p-2 md:p-4 bg-slate-50 border-t border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-4">
          <div className="w-7 h-7 md:w-9 md:h-9 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0">
            {initials}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs md:text-sm font-bold text-slate-900 truncate">
              {profile.full_name || 'User'}
            </div>
            <div className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {profile.role === 'admin' ? <><Icon name="premium" size="xs" /> Admin</> : <><Icon name="graduation" size="xs" /> Candidate</>}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOutClick}
          className="btn btn-ghost !border-slate-200 !text-slate-600 btn-full"
          style={{ padding: '6px 12px', minHeight: 'unset', fontSize: '0.78rem' }}
        >
          Sign Out
        </button>
      </div>
      </aside>

      {showBye && (
        <VvipWelcomeModal
          user={profile}
          open
          onClose={() => { void logout() }}
          holdMs={3000}
          dismissible={false}
          honorific=""
          title="Goodbye!"
          message="You've been signed out. Keep practicing, and best of luck for your exam!"
        />
      )}
    </>
  )
}

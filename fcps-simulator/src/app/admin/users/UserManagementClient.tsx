'use client'

import { useEffect, useState } from 'react'
import { activateSubscription, revokeSubscription, deleteUserAccount, getUserDetails } from '@/app/admin/user-actions'
import type { UserDetails } from '@/app/admin/user-actions'

interface Profile {
  id:                       string
  full_name:                string | null
  email:                    string | null
  role:                     string | null
  subscription_status:      string | null
  subscription_expires_at:  string | null
  created_at:               string
}

interface Props { profiles: Profile[] }

const DURATIONS = [
  { label: '1 Month',  days: 30  },
  { label: '3 Months', days: 90  },
  { label: '6 Months', days: 180 },
  { label: '1 Year',   days: 365 },
]

const PLAN_LABELS: Record<number, string> = {
  30: '1 Month',
  90: '3 Months',
  180: '6 Months',
  365: '1 Year',
}

export default function UserManagementClient({ profiles: initial }: Props) {
  const [profiles,  setProfiles]  = useState<Profile[]>(initial)
  const [loading,   setLoading]   = useState<string | null>(null)
  const [filter,    setFilter]    = useState<'all' | 'active' | 'demo' | 'pending' | 'expired'>('all')

  // Get search / details from the URL if present (e.g. the dashboard's demo
  // -users table deep-links here with ?details=<id>).
  const [search, setSearch] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('search') || ''
    }
    return ''
  })

  const [detailsUserId, setDetailsUserId] = useState<string | null>(null)
  const [detailsData,   setDetailsData]   = useState<UserDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  async function openDetails(userId: string) {
    setDetailsUserId(userId)
    setDetailsData(null)
    setDetailsLoading(true)
    const data = await getUserDetails(userId)
    setDetailsData(data)
    setDetailsLoading(false)
  }

  function closeDetails() {
    setDetailsUserId(null)
    setDetailsData(null)
  }

  // Auto-open the Details panel once, on mount, if the page was deep-linked
  // with ?details=<id> (the dashboard's "Demo Users" table does this --
  // that table itself never shows subscription details, only this page does).
  useEffect(() => {
    if (typeof window === 'undefined') return
    const id = new URLSearchParams(window.location.search).get('details')
    if (id) openDetails(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = profiles.filter((p) => {
    const matchSearch =
      (p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
       p.email?.toLowerCase().includes(search.toLowerCase()))

    if (filter === 'all')     return matchSearch
    if (filter === 'active')  return matchSearch && p.subscription_status === 'active'
    if (filter === 'demo')    return matchSearch && p.subscription_status === 'demo'
    if (filter === 'pending') return matchSearch && p.subscription_status === 'pending'
    if (filter === 'expired') return matchSearch && p.subscription_status === 'expired'
    return matchSearch
  })

  async function activateUser(userId: string, days: number, label: string) {
    const amountInput = window.prompt(
      `Amount received for ${label} plan (PKR)? Leave blank to skip — this is only used for the revenue report on the Analytics/Income pages and never blocks activation.`
    )
    // User hit Cancel — don't activate at all, since a Cancel usually
    // means "wait, let me check something" rather than "activate with
    // amount 0".
    if (amountInput === null) return

    const amountPkr = amountInput.trim() === '' ? null : Number(amountInput)
    if (amountInput.trim() !== '' && (Number.isNaN(amountPkr as number) || (amountPkr as number) < 0)) {
      alert('Amount must be a positive number, or left blank.')
      return
    }

    setLoading(userId)
    const result = await activateSubscription(userId, days, amountPkr)

    if (result.success) {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + days)
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === userId
            ? { ...p, subscription_status: 'active', subscription_expires_at: expiresAt.toISOString() }
            : p
        )
      )
    }
    setLoading(null)
  }

  async function revokeAccess(userId: string) {
    if (!confirm('Revoke this user\'s subscription?')) return
    setLoading(userId)
    const result = await revokeSubscription(userId)

    if (result.success) {
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === userId ? { ...p, subscription_status: 'expired' } : p
        )
      )
    }
    setLoading(null)
  }

  async function deleteUser(userId: string, label: string) {
    if (!confirm(`Permanently delete ${label}'s account? This cannot be undone — their login, subscription, and exam history will all be removed.`)) return
    setLoading(userId)
    const result = await deleteUserAccount(userId)

    if (result.success) {
      setProfiles((prev) => prev.filter((p) => p.id !== userId))
      if (detailsUserId === userId) closeDetails()
    } else {
      alert('Error: ' + result.error)
    }
    setLoading(null)
  }

  const detailsProfile = detailsUserId ? profiles.find((p) => p.id === detailsUserId) : null

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#000000', marginBottom: 4 }}>
          User Management
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          Activate subscriptions and manage student access
        </p>
      </div>

      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
          style={{ maxWidth: 320 }}
        />
        {(['all', 'active', 'demo', 'pending', 'expired'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-wrapper" style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th>Student</th>
              <th>Status</th>
              <th>Expires</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#475569', padding: '32px' }}>
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const expiry = p.subscription_expires_at
                  ? new Date(p.subscription_expires_at)
                  : null
                const isExpired =
                  p.subscription_status === 'active' && expiry && expiry < new Date()
                const effectiveStatus = isExpired ? 'expired' : p.subscription_status
                const canRevoke = effectiveStatus === 'active' || effectiveStatus === 'demo'
                const isBusy = loading === p.id

                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#000000', fontSize: '0.875rem' }}>
                        {p.full_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#475569' }}>{p.email}</div>
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          effectiveStatus === 'active'
                            ? 'badge-active'
                            : effectiveStatus === 'demo'
                            ? 'badge-demo'
                            : effectiveStatus === 'pending'
                            ? 'badge-pending'
                            : 'badge-expired'
                        }`}
                      >
                        {effectiveStatus}
                      </span>
                    </td>

                    <td style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      {expiry ? expiry.toLocaleDateString('en-PK') : '—'}
                    </td>

                    <td style={{ fontSize: '0.8rem', color: '#475569' }}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Extend-by-months dropdown, replaces the old row
                            of four separate +1/+3/+6/+12 buttons. */}
                        <select
                          value=""
                          disabled={isBusy}
                          onChange={(e) => {
                            const days = Number(e.target.value)
                            if (!days) return
                            const d = DURATIONS.find((x) => x.days === days)
                            activateUser(p.id, days, d?.label || `${days} days`)
                            e.target.value = ''
                          }}
                          className="btn btn-sm"
                          style={{
                            background: 'rgba(13,148,136,0.12)',
                            color: '#0d9488',
                            border: '1px solid rgba(13,148,136,0.25)',
                            fontSize: '0.72rem',
                            padding: '5px 8px',
                            fontWeight: 700,
                          }}
                        >
                          <option value="" disabled>
                            {isBusy ? '...' : 'Extend...'}
                          </option>
                          {DURATIONS.map((d) => (
                            <option key={d.days} value={d.days}>
                              +{d.label}
                            </option>
                          ))}
                        </select>

                        {canRevoke && (
                          <button
                            onClick={() => revokeAccess(p.id)}
                            disabled={isBusy}
                            className="btn btn-sm btn-danger"
                            style={{ fontSize: '0.72rem', padding: '5px 10px' }}
                          >
                            Revoke
                          </button>
                        )}

                        <button
                          onClick={() => deleteUser(p.id, p.full_name || p.email || 'this user')}
                          disabled={isBusy}
                          className="btn btn-sm btn-danger"
                          style={{ fontSize: '0.72rem', padding: '5px 10px' }}
                        >
                          Delete
                        </button>

                        <button
                          onClick={() => openDetails(p.id)}
                          disabled={isBusy}
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.72rem', padding: '5px 10px' }}
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Details modal — full profile + subscription + payment history.
          Deliberately only reachable from this page (the admin dashboard's
          demo-users table links here rather than rendering this inline). */}
      {detailsUserId && (
        <div
          onClick={closeDetails}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-card"
            style={{
              background: 'white',
              width: '100%',
              maxWidth: 520,
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: 24,
              borderRadius: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  {detailsProfile?.full_name || detailsData?.profile?.full_name || 'User Details'}
                </h2>
                <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {detailsProfile?.email || detailsData?.profile?.email}
                </p>
              </div>
              <button
                onClick={closeDetails}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.72rem', padding: '4px 10px' }}
              >
                Close
              </button>
            </div>

            {detailsLoading || !detailsData ? (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Loading...</p>
            ) : (
              <>
                {/* Profile */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                    marginBottom: 18,
                    fontSize: '0.82rem',
                  }}
                >
                  <Field label="Phone" value={detailsData.profile?.phone || '—'} />
                  <Field label="Role" value={detailsData.profile?.role || '—'} />
                  <Field label="Status" value={detailsData.profile?.subscription_status || '—'} />
                  <Field
                    label="Expires"
                    value={
                      detailsData.profile?.subscription_expires_at
                        ? new Date(detailsData.profile.subscription_expires_at).toLocaleDateString('en-PK')
                        : '—'
                    }
                  />
                  <Field
                    label="Registered"
                    value={
                      detailsData.profile?.created_at
                        ? new Date(detailsData.profile.created_at).toLocaleDateString('en-PK')
                        : '—'
                    }
                  />
                  <Field
                    label="Exam Attempts"
                    value={
                      detailsData.examStats.avgScore !== null
                        ? `${detailsData.examStats.attempts} (avg ${detailsData.examStats.avgScore}%)`
                        : String(detailsData.examStats.attempts)
                    }
                  />
                </div>

                {/* Payment history */}
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                  Subscription History
                </h3>
                {detailsData.payments.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 16 }}>No activations or revocations logged yet.</p>
                ) : (
                  <table style={{ width: '100%', fontSize: '0.78rem', marginBottom: 16 }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: '#64748b' }}>
                        <th style={{ paddingBottom: 4 }}>Action</th>
                        <th style={{ paddingBottom: 4 }}>Plan</th>
                        <th style={{ paddingBottom: 4 }}>Amount</th>
                        <th style={{ paddingBottom: 4 }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailsData.payments.map((pay) => (
                        <tr key={pay.id}>
                          <td style={{ padding: '4px 0', fontWeight: 600, color: pay.action === 'activate' ? '#0d9488' : '#dc2626' }}>
                            {pay.action}
                          </td>
                          <td style={{ padding: '4px 0', color: '#475569' }}>
                            {pay.days ? PLAN_LABELS[pay.days] || `${pay.days} days` : '—'}
                          </td>
                          <td style={{ padding: '4px 0', color: '#475569' }}>
                            {pay.amount_pkr ? `Rs. ${pay.amount_pkr.toLocaleString('en-PK')}` : '—'}
                          </td>
                          <td style={{ padding: '4px 0', color: '#64748b' }}>
                            {new Date(pay.created_at).toLocaleDateString('en-PK')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <button
                  onClick={() => deleteUser(detailsUserId, detailsData.profile?.full_name || detailsData.profile?.email || 'this user')}
                  disabled={loading === detailsUserId}
                  className="btn btn-sm btn-danger"
                  style={{ fontSize: '0.75rem', padding: '6px 14px' }}
                >
                  Delete Account
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ color: '#1e293b', fontWeight: 600 }}>{value}</div>
    </div>
  )
}

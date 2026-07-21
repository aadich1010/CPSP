'use client'

import { useState } from 'react'
import { activateSubscription, revokeSubscription } from '@/app/admin/user-actions'
import { useRouter } from 'next/navigation'

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

export default function UserManagementClient({ profiles: initial }: Props) {
  const [profiles,  setProfiles]  = useState<Profile[]>(initial)
  const [loading,   setLoading]   = useState<string | null>(null)
  const [filter,    setFilter]    = useState<'all' | 'active' | 'pending' | 'expired'>('all')
  const router = useRouter()

  // Get search from URL if present
  const [search, setSearch] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('search') || ''
    }
    return ''
  })

  const filtered = profiles.filter((p) => {
    const matchSearch =
      (p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
       p.email?.toLowerCase().includes(search.toLowerCase()))

    if (filter === 'all')     return matchSearch
    if (filter === 'active')  return matchSearch && p.subscription_status === 'active'
    if (filter === 'pending') return matchSearch && p.subscription_status === 'pending'
    if (filter === 'expired') return matchSearch && p.subscription_status === 'expired'
    return matchSearch
  })

  async function activateUser(userId: string, days: number) {
    setLoading(userId)
    const result = await activateSubscription(userId, days)

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

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>
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
        {(['all', 'active', 'pending', 'expired'] as const).map((f) => (
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
        <table style={{ minWidth: 800 }}>
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

                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.875rem' }}>
                        {p.full_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#475569' }}>{p.email}</div>
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          effectiveStatus === 'active'
                            ? 'badge-active'
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
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {/* Activation dropdown */}
                        {DURATIONS.map((d) => (
                          <button
                            key={d.days}
                            onClick={() => activateUser(p.id, d.days)}
                            disabled={loading === p.id}
                            className="btn btn-sm"
                            style={{
                              background: 'rgba(13,148,136,0.12)',
                              color: '#2dd4bf',
                              border: '1px solid rgba(13,148,136,0.25)',
                              fontSize: '0.72rem',
                              padding: '5px 10px',
                            }}
                          >
                            {loading === p.id ? '...' : `+${d.label}`}
                          </button>
                        ))}

                        {p.subscription_status === 'active' && (
                          <button
                            onClick={() => revokeAccess(p.id)}
                            disabled={loading === p.id}
                            className="btn btn-sm btn-danger"
                            style={{ fontSize: '0.72rem', padding: '5px 10px' }}
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

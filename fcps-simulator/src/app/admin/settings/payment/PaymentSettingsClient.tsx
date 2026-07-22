'use client'

import { useState } from 'react'
import { updatePaymentSetting } from './actions'

type Setting = {
  provider: 'jazzcash' | 'easypaisa' | 'bank'
  account_number: string
  account_name: string
  extra_info: string | null
}

const PROVIDER_META: Record<Setting['provider'], { title: string; icon: string; color: string; extraLabel: string }> = {
  jazzcash: { title: 'JazzCash', icon: '📱', color: '#f59e0b', extraLabel: 'Notes (optional)' },
  easypaisa: { title: 'EasyPaisa', icon: '💸', color: '#16a34a', extraLabel: 'Notes (optional)' },
  bank: { title: 'Bank Transfer', icon: '🏛️', color: '#2563eb', extraLabel: 'Bank Name' },
}

export default function PaymentSettingsClient({ initialSettings }: { initialSettings: Setting[] }) {
  const [settings, setSettings] = useState(initialSettings)

  function handleSaved(updated: Setting) {
    setSettings((prev) => prev.map((s) => (s.provider === updated.provider ? updated : s)))
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16,
      }}
    >
      {settings.map((s) => (
        <ProviderCard key={s.provider} setting={s} onSaved={handleSaved} />
      ))}
    </div>
  )
}

function ProviderCard({ setting, onSaved }: { setting: Setting; onSaved: (s: Setting) => void }) {
  const meta = PROVIDER_META[setting.provider]
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [accountNumber, setAccountNumber] = useState(setting.account_number)
  const [accountName, setAccountName] = useState(setting.account_name)
  const [extraInfo, setExtraInfo] = useState(setting.extra_info || '')

  async function handleSave() {
    setSaving(true)
    setError('')
    const result = await updatePaymentSetting(setting.provider, accountNumber, accountName, extraInfo || null)
    setSaving(false)

    if (result.error) {
      setError(result.error)
      return
    }
    onSaved({ provider: setting.provider, account_number: accountNumber, account_name: accountName, extra_info: extraInfo || null })
    setEditing(false)
  }

  function handleCancel() {
    setAccountNumber(setting.account_number)
    setAccountName(setting.account_name)
    setExtraInfo(setting.extra_info || '')
    setError('')
    setEditing(false)
  }

  return (
    <div
      className="glass-card"
      style={{
        padding: 18,
        borderTop: `3px solid ${meta.color}`,
        background: 'white',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: '1.5rem' }}>{meta.icon}</span>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{meta.title}</h3>
      </div>

      {!editing ? (
        <>
          <Field label="Account #" value={setting.account_number} mono />
          <Field label="Account Name" value={setting.account_name} />
          {setting.extra_info && <Field label={meta.extraLabel} value={setting.extra_info} />}
          <button
            onClick={() => setEditing(true)}
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 12, width: '100%', fontSize: '0.78rem' }}
          >
            Edit
          </button>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={labelStyle}>Account Number</label>
            <input className="input" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Account Name</label>
            <input className="input" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>{meta.extraLabel}</label>
            <input className="input" value={extraInfo} onChange={(e) => setExtraInfo(e.target.value)} />
          </div>

          {error && <p style={{ color: '#dc2626', fontSize: '0.78rem', fontWeight: 600 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm" style={{ flex: 1, fontSize: '0.78rem' }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={handleCancel} disabled={saving} className="btn btn-ghost btn-sm" style={{ flex: 1, fontSize: '0.78rem' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', fontFamily: mono ? 'monospace' : 'inherit' }}>
        {value || <span style={{ color: '#cbd5e1', fontWeight: 500 }}>Not set</span>}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: 4,
}

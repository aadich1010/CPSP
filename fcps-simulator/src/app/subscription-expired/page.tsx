'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Save, X, Loader2, Copy, Check as CheckIcon } from 'lucide-react'
import Icon from '@/design-system/Icon';

// Only 'jazzcash' and 'bank' are offered to students. EasyPaisa is gone from
// the buyer-facing flow (product decision -- see admin Payment Settings for
// context); the DB column itself is untyped text, not an enum, so an old
// 'easypaisa' row sitting there unused after this change is harmless and
// doesn't need a migration to remove.
type Provider = 'jazzcash' | 'bank'

interface PaymentSetting {
  provider: Provider
  account_number: string
  account_name: string
  extra_info: string | null
}

function SubscriptionExpiredContent() {
  const [settings, setSettings] = useState<PaymentSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [wasDemo, setWasDemo] = useState(false)
  const [editingProvider, setEditingProvider] = useState<PaymentSetting | null>(null)
  const [copiedProvider, setCopiedProvider] = useState<Provider | null>(null)
  const supabase = createClient()
  const searchParams = useSearchParams()

  // The pricing section (and the Azadi offer popup) now link here with
  // ?plan=<name>&amount=<rupees>&period=<text> so the buyer sees exactly
  // what they're paying for instead of a blank, plan-agnostic payment
  // screen. Any of the three can be missing (e.g. a demo-expired account
  // that landed here without picking a plan first) -- treated as "no plan
  // selected" rather than crashing on a missing param.
  const selectedPlan = searchParams.get('plan')
  const selectedAmount = searchParams.get('amount')
  const selectedPeriod = searchParams.get('period')
  const hasSelectedPlan = Boolean(selectedPlan && selectedAmount)

  const whatsappNumber = "923324737436"
  const whatsappMsg = encodeURIComponent(
    hasSelectedPlan
      ? `Hi Admin, I have paid Rs. ${selectedAmount} for the ${selectedPlan} plan${selectedPeriod ? ` (${selectedPeriod})` : ''}. Please activate my account.\n\nEmail: [My Registered Email]`
      : "Hi Admin, I have paid for the FCPS Simulator. Please activate my account.\n\nEmail: [My Registered Email]"
  )
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMsg}`

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch current user and check role
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, subscription_status')
          .eq('id', user.id)
          .single()
        setIsAdmin(profile?.role === 'admin')
        // A 'demo' account that landed here got here via the 7-day expiry
        // (see 20260815120000_seven_day_full_access_trial.sql migration),
        // not because they were never activated -- worth a different message
        // than the generic "pending activation" copy shown to brand-new/held
        // accounts.
        setWasDemo(profile?.subscription_status === 'demo')
      }

      // 2. Fetch payment settings. 'easypaisa' rows (from the old three-way
      // setup) are filtered out here even if the DB still has one lying
      // around, so a stale row can never resurface in the UI.
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .order('provider', { ascending: false })

      const usable = (data || []).filter(
        (d): d is PaymentSetting => d.provider === 'jazzcash' || d.provider === 'bank'
      )

      if (usable.length > 0) {
        setSettings(usable)
      } else {
        // Fallback to hardcoded defaults if table doesn't exist or is empty
        setSettings([
          { provider: 'jazzcash', account_number: '0300-XXXXXXX', account_name: '[Your Name]', extra_info: null },
          { provider: 'bank', account_number: 'XXXX-XXXX-XXXX-XXXX', account_name: '[Your Name]', extra_info: 'HBL / Meezan Bank' },
        ])
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  const handleUpdate = async (updatedData: PaymentSetting) => {
    const { error } = await supabase
      .from('payment_settings')
      .upsert({
        provider: updatedData.provider,
        account_number: updatedData.account_number,
        account_name: updatedData.account_name,
        extra_info: updatedData.extra_info,
        updated_at: new Date().toISOString()
      }, { onConflict: 'provider' })

    if (error) {
      alert('Error updating: ' + error.message)
      return
    }

    // Refresh settings
    setSettings(prev => prev.map(s => s.provider === updatedData.provider ? updatedData : s))
    setEditingProvider(null)
  }

  async function handleCopy(provider: Provider, accountNumber: string) {
    try {
      await navigator.clipboard.writeText(accountNumber)
      setCopiedProvider(provider)
      setTimeout(() => setCopiedProvider((p) => (p === provider ? null : p)), 1800)
    } catch {
      // Clipboard API unavailable (e.g. insecure context) -- the number is
      // already visible on screen for manual copy, so this is a silent no-op.
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  const bank = settings.find(s => s.provider === 'bank')
  const jazzcash = settings.find(s => s.provider === 'jazzcash')

  return (
    <div className="min-h-screen" style={{
      background: '#F9FAFB',
      padding: '20px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#0f172a',
    }}>
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: 24, maxWidth: 600 }}
      >
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(16,185,129,0.1)',
          padding: '6px 12px',
          borderRadius: 100,
          color: '#10B981',
          fontSize: '0.75rem',
          fontWeight: 700,
          marginBottom: 10
        }}>
          <span style={{ fontSize: '1rem' }}><Icon name="bolt" /></span> PREMIUM ACCESS REQUIRED
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 8 }}>
          {wasDemo ? 'Your Demo Period Has Ended' : 'Unlock Your Potential'}
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5 }}>
          {wasDemo ? (
            <>You&apos;ve used up your <span style={{ color: '#f59e0b', fontWeight: 700 }}>7-day free trial</span> — but full access doesn&apos;t have to stop here. Subscribe now to keep practicing with the full question bank.</>
          ) : (
            <>Your account is <span style={{ color: '#f59e0b', fontWeight: 700 }}>pending activation</span>. Complete payment for full access.</>
          )}
        </p>

        {/* Selected plan summary -- previously every "Choose your plan" CTA
            on the homepage dropped the buyer here with zero indication of
            what they'd chosen or how much to send. Now, whenever a plan was
            selected, that's shown front and center before any QR/account
            details. */}
        {hasSelectedPlan ? (
          <div style={{
            marginTop: 16,
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            background: 'white',
            border: '2px solid #10B981',
            borderRadius: 14,
            padding: '12px 24px',
            boxShadow: '0 4px 14px rgba(16,185,129,0.15)',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              You&apos;re subscribing to
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
              {selectedPlan} Plan
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981' }}>
              Rs. {Number(selectedAmount).toLocaleString()}
              {selectedPeriod && <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}> / {selectedPeriod}</span>}
            </div>
          </div>
        ) : (
          <div style={{
            marginTop: 16,
            fontSize: '0.8rem',
            color: '#94a3b8',
          }}>
            Haven&apos;t picked a plan yet? <a href="/#pricing" style={{ color: '#10B981', fontWeight: 700, textDecoration: 'underline' }}>See pricing options</a>
          </div>
        )}
      </motion.div>

      {/* Payment options -- Bank Transfer (QR) and JazzCash side by side.
          Previously only the bank QR rendered here even though JazzCash was
          configured in the system, so JazzCash-only buyers had no visible
          way to pay at all. */}
      <div style={{
        width: '100%',
        maxWidth: 720,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'stretch',
        gap: 20
      }}>
        {/* Bank Transfer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="glass-card"
          style={{
            padding: '28px 24px',
            textAlign: 'center',
            border: '2px solid rgba(16,185,129,0.35)',
            background: 'white',
            flex: '1 1 300px',
            maxWidth: 340,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14
          }}
        >
          <h3 style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.01em' }}>
            Bank Transfer
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.5, maxWidth: 320 }}>
            Scan the QR code below with your banking app to send payment and unlock full access.
          </p>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/payment-qr.jpeg"
            alt="Scan this QR code to send payment"
            style={{
              width: '100%',
              maxWidth: 220,
              height: 'auto',
              borderRadius: 16,
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)'
            }}
          />

          {bank && (
            <div style={{ marginTop: 4, textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{bank.account_name}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', marginTop: 2 }}>{bank.account_number}</div>
              {bank.extra_info && (
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#10B981', marginTop: 2 }}>{bank.extra_info}</div>
              )}
              <button
                onClick={() => handleCopy('bank', bank.account_number)}
                style={{
                  marginTop: 8,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'transparent',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '5px 12px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                {copiedProvider === 'bank' ? <><CheckIcon size={13} /> Copied</> : <><Copy size={13} /> Copy account #</>}
              </button>
            </div>
          )}

          {isAdmin && bank && (
            <button
              onClick={() => setEditingProvider(bank)}
              style={{
                marginTop: 2,
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '0.72rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Edit bank details
            </button>
          )}
        </motion.div>

        {/* JazzCash */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.22 }}
          className="glass-card"
          style={{
            padding: '28px 24px',
            textAlign: 'center',
            border: '2px solid rgba(245,158,11,0.35)',
            background: 'white',
            flex: '1 1 300px',
            maxWidth: 340,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14
          }}
        >
          <h3 style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.01em' }}>
            JazzCash
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.5, maxWidth: 320 }}>
            Send payment directly to this JazzCash mobile account.
          </p>

          {jazzcash && (
            <div style={{
              marginTop: 4,
              textAlign: 'center',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 12,
              padding: '16px 20px',
              width: '100%',
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>{jazzcash.account_name}</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#b45309', fontFamily: 'monospace', marginTop: 4 }}>{jazzcash.account_number}</div>
              {jazzcash.extra_info && (
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400e', marginTop: 2 }}>{jazzcash.extra_info}</div>
              )}
              <button
                onClick={() => handleCopy('jazzcash', jazzcash.account_number)}
                style={{
                  marginTop: 10,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'white',
                  border: '1px solid #f59e0b',
                  borderRadius: 8,
                  padding: '5px 12px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#b45309',
                  cursor: 'pointer',
                }}
              >
                {copiedProvider === 'jazzcash' ? <><CheckIcon size={13} /> Copied</> : <><Copy size={13} /> Copy JazzCash #</>}
              </button>
            </div>
          )}

          {isAdmin && jazzcash && (
            <button
              onClick={() => setEditingProvider(jazzcash)}
              style={{
                marginTop: 2,
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '0.72rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Edit JazzCash details
            </button>
          )}
        </motion.div>
      </div>

      {/* Shared "send proof" CTA -- one WhatsApp message covers whichever
          method the buyer used, and now includes the selected plan/amount
          so the admin doesn't have to ask "which plan is this for?" before
          activating. */}
      <motion.a
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginTop: 22,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '13px 26px',
          fontSize: '0.95rem',
          fontWeight: 700,
          color: 'white',
          borderRadius: 10,
          background: '#25D366',
          textDecoration: 'none',
          boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)'
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.511.895 3.156 1.368 4.872 1.368 5.161 0 9.359-4.198 9.362-9.361 0-2.502-1.001-4.853-2.82-6.671-1.819-1.818-4.17-2.819-6.671-2.82-5.163 0-9.36 4.198-9.362 9.361-.001 1.832.532 3.615 1.541 5.115l-.997 3.64 3.738-.981z"/>
        </svg>
        Send Payment Proof on WhatsApp
      </motion.a>
      <p style={{ marginTop: 8, fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', maxWidth: 340 }}>
        Accounts are typically activated within a few hours of receiving your proof — usually much sooner during the day.
      </p>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingProvider && (
          <EditModal
            data={editingProvider}
            onClose={() => setEditingProvider(null)}
            onSave={handleUpdate}
          />
        )}
      </AnimatePresence>

      {/* Trust Badges */}
      <div style={{ marginTop: 24, display: 'flex', gap: 20, opacity: 0.5, fontSize: '0.75rem', fontWeight: 600 }}>
        <span><Icon name="locked" /> Secure</span>
        <span><Icon name="bolt" /> Fast Activation</span>
        <span><Icon name="support" /> 24/7 Support</span>
      </div>
    </div>
  )
}

export default function SubscriptionExpiredPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    }>
      <SubscriptionExpiredContent />
    </Suspense>
  )
}

interface EditModalProps {
  data: PaymentSetting
  onClose: () => void
  onSave: (data: PaymentSetting) => void
}

function EditModal({ data, onClose, onSave }: EditModalProps) {
  const [formData, setFormData] = useState<PaymentSetting>(data)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        style={{
          background: 'white',
          width: '100%',
          maxWidth: 400,
          borderRadius: 24,
          padding: 32,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900 }}>Update Details</h2>
          <button onClick={onClose} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Account Number</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]"
              value={formData.account_number}
              onChange={e => setFormData({ ...formData, account_number: e.target.value })}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Account Name</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]"
              value={formData.account_name}
              onChange={e => setFormData({ ...formData, account_name: e.target.value })}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              {formData.provider === 'bank' ? 'Bank Name' : 'Extra Info'}
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]"
              value={formData.extra_info || ''}
              onChange={e => setFormData({ ...formData, extra_info: e.target.value })}
            />
          </div>
        </div>

        <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
          <button onClick={() => onSave(formData)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 font-bold text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02]" style={{ flex: 1 }}>
            <Save size={18} style={{ marginRight: 8 }} /> Save Changes
          </button>
          <button onClick={onClose} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-semibold text-slate-600 transition-all hover:border-emerald-400 hover:text-slate-900" style={{ flex: 1 }}>
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

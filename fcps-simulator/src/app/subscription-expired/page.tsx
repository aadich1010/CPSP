'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Save, X, Loader2 } from 'lucide-react'

interface PaymentSetting {
  provider: 'jazzcash' | 'easypaisa' | 'bank'
  account_number: string
  account_name: string
  extra_info: string | null
}

export default function SubscriptionExpiredPage() {
  const [settings, setSettings] = useState<PaymentSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editingProvider, setEditingProvider] = useState<PaymentSetting | null>(null)
  const supabase = createClient()

  const whatsappNumber = "923324737436"
  const whatsappMsg = encodeURIComponent("Hi Admin, I have paid for the FCPS Simulator. Please activate my account.\n\nEmail: [My Registered Email]")
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMsg}`

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch current user and check role
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        setIsAdmin(profile?.role === 'admin')
      }

      // 2. Fetch payment settings
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .order('provider', { ascending: false })

      if (data && data.length > 0) {
        setSettings(data)
      } else {
        // Fallback to hardcoded defaults if table doesn't exist or is empty
        setSettings([
          { provider: 'jazzcash', account_number: '0300-XXXXXXX', account_name: '[Your Name]', extra_info: null },
          { provider: 'easypaisa', account_number: '0300-XXXXXXX', account_name: '[Your Name]', extra_info: null },
          { provider: 'bank', account_number: 'XXXX-XXXX-XXXX-XXXX', account_name: '[Your Name]', extra_info: 'HBL / Meezan Bank' }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
  }

  const bank = settings.find(s => s.provider === 'bank')

  return (
    <div className="min-h-screen" style={{ 
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      padding: '20px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#0f172a',
      overflow: 'hidden'
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
          background: 'rgba(13, 148, 136, 0.1)', 
          padding: '6px 12px', 
          borderRadius: 100,
          color: '#0d9488',
          fontSize: '0.75rem',
          fontWeight: 700,
          marginBottom: 10
        }}>
          <span style={{ fontSize: '1rem' }}>⚡</span> PREMIUM ACCESS REQUIRED
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 8 }}>
          Unlock Your Potential
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5 }}>
          Your account is <span style={{ color: '#f59e0b', fontWeight: 700 }}>pending activation</span>. 
          Complete payment for full access.
        </p>
      </motion.div>

      {/* Centered QR — Bank Transfer only */}
      <div style={{ 
        width: '100%', 
        maxWidth: 460,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20
      }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="glass-card" 
          style={{ 
            padding: '28px 24px',
            textAlign: 'center',
            border: '2px solid rgba(13, 148, 136, 0.3)',
            background: 'white',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14
          }}
        >
          <h3 style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.01em' }}>
            Scan to Unlock
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
              maxWidth: 240,
              height: 'auto',
              borderRadius: 16,
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)'
            }}
          />

          {bank && (
            <div style={{ marginTop: 4, textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{bank.account_name}</div>
              {bank.extra_info && (
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0d9488', marginTop: 2 }}>{bank.extra_info}</div>
              )}
            </div>
          )}

          <a 
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{ 
              marginTop: 6,
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 8, 
              padding: '11px 22px', 
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'white',
              borderRadius: 10,
              background: '#25D366',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(37, 211, 102, 0.2)'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.511.895 3.156 1.368 4.872 1.368 5.161 0 9.359-4.198 9.362-9.361 0-2.502-1.001-4.853-2.82-6.671-1.819-1.818-4.17-2.819-6.671-2.82-5.163 0-9.36 4.198-9.362 9.361-.001 1.832.532 3.615 1.541 5.115l-.997 3.64 3.738-.981z"/>
            </svg>
            Send Payment Proof
          </a>

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
      </div>

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
        <span>🔒 Secure</span>
        <span>⚡ Instant Access</span>
        <span>📞 24/7 Support</span>
      </div>
    </div>
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
              className="input"
              value={formData.account_number}
              onChange={e => setFormData({ ...formData, account_number: e.target.value })}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Account Name</label>
            <input 
              className="input"
              value={formData.account_name}
              onChange={e => setFormData({ ...formData, account_name: e.target.value })}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              {formData.provider === 'bank' ? 'Bank Name' : 'Extra Info'}
            </label>
            <input 
              className="input"
              value={formData.extra_info || ''}
              onChange={e => setFormData({ ...formData, extra_info: e.target.value })}
            />
          </div>
        </div>

        <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
          <button onClick={() => onSave(formData)} className="btn btn-primary" style={{ flex: 1 }}>
            <Save size={18} style={{ marginRight: 8 }} /> Save Changes
          </button>
          <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

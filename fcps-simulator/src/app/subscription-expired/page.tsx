'use client'

import { useState, useEffect } from 'react'
import { logout } from '@/app/auth/actions'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Edit2, Save, X, Loader2 } from 'lucide-react'

export default function SubscriptionExpiredPage() {
  const [settings, setSettings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editingProvider, setEditingProvider] = useState<any>(null)
  const supabase = createClient()

  const whatsappNumber = "923000000000" // Placeholder
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

  const handleUpdate = async (updatedData: any) => {
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

  const jazzcash = settings.find(s => s.provider === 'jazzcash')
  const easypaisa = settings.find(s => s.provider === 'easypaisa')
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

      {/* Main Content Grid */}
      <div style={{ 
        width: '100%', 
        maxWidth: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 20
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: 16
        }}>
          {jazzcash && (
            <PaymentCard 
              data={jazzcash}
              title="JazzCash" 
              icon="📱" 
              color="#f59e0b"
              delay={0.1}
              isAdmin={isAdmin}
              onEdit={() => setEditingProvider(jazzcash)}
            />
          )}

          {easypaisa && (
            <PaymentCard 
              data={easypaisa}
              title="EasyPaisa" 
              icon="💸" 
              color="#16a34a"
              delay={0.2}
              isAdmin={isAdmin}
              onEdit={() => setEditingProvider(easypaisa)}
            />
          )}

          {bank && (
            <PaymentCard 
              data={bank}
              title="Bank Transfer" 
              icon="🏛️" 
              color="#2563eb"
              delay={0.3}
              isAdmin={isAdmin}
              onEdit={() => setEditingProvider(bank)}
            />
          )}
        </div>

        {/* Instructions & CTA Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card" 
          style={{ 
            padding: '20px 24px',
            textAlign: 'center',
            border: '2px solid rgba(13, 148, 136, 0.3)',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            flexWrap: 'wrap'
          }}
        >
          <div style={{ textAlign: 'left', flex: 1, minWidth: 280 }}>
            <h3 style={{ fontWeight: 800, marginBottom: 4, fontSize: '1.05rem' }}>
              Final Step: Send Payment Proof
            </h3>
            <p style={{ color: '#475569', fontSize: '0.82rem', lineHeight: 1.4 }}>
              Share your <strong>Transaction ID</strong> or <strong>Screenshot</strong> via WhatsApp.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a 
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 8, 
                padding: '12px 24px', 
                fontSize: '0.95rem',
                background: '#25D366',
                border: 'none',
                boxShadow: '0 4px 12px rgba(37, 211, 102, 0.2)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.511.895 3.156 1.368 4.872 1.368 5.161 0 9.359-4.198 9.362-9.361 0-2.502-1.001-4.853-2.82-6.671-1.819-1.818-4.17-2.819-6.671-2.82-5.163 0-9.36 4.198-9.362 9.361-.001 1.832.532 3.615 1.541 5.115l-.997 3.64 3.738-.981z"/>
              </svg>
              WhatsApp Proof
            </a>

            <form action={logout}>
              <button type="submit" style={{ 
                background: 'transparent', 
                border: 'none', 
                color: '#64748b', 
                fontSize: '0.75rem', 
                cursor: 'pointer',
                textDecoration: 'underline' 
              }}>
                Sign Out
              </button>
            </form>
          </div>
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

function PaymentCard({ data, title, icon, color, delay, isAdmin, onEdit }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="glass-card" 
      style={{ 
        padding: '18px', 
        borderTop: `3px solid ${color}`,
        position: 'relative',
        overflow: 'hidden',
        background: 'white'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: '1.8rem' }}>{icon}</div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{title}</h3>
        </div>
        {isAdmin && (
          <button 
            onClick={onEdit}
            style={{ 
              background: 'rgba(13, 148, 136, 0.1)', 
              color: '#0d9488', 
              border: 'none', 
              padding: '6px', 
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <Edit2 size={14} />
          </button>
        )}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Account #</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, fontFamily: 'monospace', color: '#1e293b' }}>{data.account_number}</div>
        </div>
        
        <div>
          <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Name</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>{data.account_name}</div>
        </div>

        {data.extra_info && (
          <div style={{ gridColumn: 'span 2', marginTop: 4 }}>
            <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
              {data.provider === 'bank' ? 'Bank Name' : 'Notes'}
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0d9488' }}>{data.extra_info}</div>
          </div>
        )}
      </div>

      <div style={{ 
        position: 'absolute', 
        right: -8, 
        top: -8, 
        fontSize: '2.5rem', 
        opacity: 0.04, 
        transform: 'rotate(-10deg)',
        pointerEvents: 'none'
      }}>
        {icon}
      </div>
    </motion.div>
  )
}

function EditModal({ data, onClose, onSave }: any) {
  const [formData, setFormData] = useState(data)

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

'use client'

import { useState } from 'react'
import { quickActivateUser } from './user-actions'

export default function QuickActivateButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)

  const handleActivate = async () => {
    if (!confirm('Activate this user for 1 month?')) return
    setLoading(true)
    const res = await quickActivateUser(userId)
    if (res.success) {
      alert('User activated successfully!')
    } else {
      alert('Error: ' + res.error)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleActivate}
      disabled={loading}
      className="btn btn-primary btn-sm"
      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
    >
      {loading ? '...' : '⚡ Quick Activate'}
    </button>
  )
}

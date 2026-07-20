'use client'

import { useState } from 'react'
import { deleteAllQuestions } from './actions'
import { useRouter } from 'next/navigation'

export default function DeleteAllButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleHandleDelete = async () => {
    if (!confirm('⚠️ ARE YOU SURE? This will delete ALL questions from the database forever! This cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      await deleteAllQuestions()
      alert('All questions deleted successfully.')
      router.refresh()
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleHandleDelete}
      disabled={loading}
      title="Delete All Questions"
      style={{ 
        color: '#ffffff',
        background: 'linear-gradient(135deg, #0d9488, #0f766e)',
        border: 'none',
        borderRadius: 8,
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        flexShrink: 0,
        boxShadow: '0 2px 4px rgba(13,148,136,0.2)',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(13,148,136,0.3)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(13,148,136,0.2)' }}
    >
      {loading ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4h6v2"/>
        </svg>
      )}
    </button>
  )
}

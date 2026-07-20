'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface SubjectDropdownProps {
  currentSubject: string;
  subjects: string[];
}

export default function SubjectDropdown({ currentSubject, subjects }: SubjectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="dropdown" ref={dropdownRef} style={{ position: 'relative', zIndex: 1000 }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost btn-sm" 
        style={{ 
          border: 'none', 
          minWidth: 140,
          padding: '4px 10px',
          fontSize: '0.75rem',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0d9488, #0f766e)',
          color: '#ffffff',
          fontWeight: 800,
          boxShadow: '0 2px 4px rgba(13,148,136,0.15)',
          height: 32,
          borderRadius: 8
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          📂 {currentSubject === 'all' ? 'All Subjects' : currentSubject}
        </span>
        <span style={{ fontSize: '0.55rem', opacity: 0.8, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#ffffff' }}>▼</span>
      </button>

      {isOpen && (
        <div 
          className="animate-fade-in" 
          style={{ 
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 5,
            minWidth: 220,
            backgroundColor: 'white',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 8,
            display: 'block'
          }}
        >
          <Link 
            href="/admin/questions"
            onClick={() => setIsOpen(false)}
            style={{ 
              display: 'block',
              padding: '10px 16px',
              fontWeight: currentSubject === 'all' ? 800 : 500, 
              color: currentSubject === 'all' ? '#0d9488' : '#475569',
              background: currentSubject === 'all' ? 'rgba(13, 148, 136, 0.05)' : 'transparent',
              borderRadius: 8,
              fontSize: '0.85rem',
              textDecoration: 'none'
            }}
          >
            📁 All Subjects
          </Link>
          <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {subjects.map((s) => (
              <Link
                key={s}
                href={`/admin/questions?subject=${encodeURIComponent(s)}`}
                onClick={() => setIsOpen(false)}
                style={{ 
                  display: 'block',
                  padding: '10px 16px',
                  fontWeight: currentSubject === s ? 800 : 500,
                  color: currentSubject === s ? '#0d9488' : '#475569',
                  background: currentSubject === s ? 'rgba(13, 148, 136, 0.05)' : 'transparent',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  textDecoration: 'none'
                }}
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

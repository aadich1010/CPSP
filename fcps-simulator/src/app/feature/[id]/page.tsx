'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FEATURES } from '@/lib/featuresData';
import { useMemo } from 'react';

export default function FeaturePage() {
  const params = useParams();
  const id = params?.id as string;
  
  const feature = useMemo(() => FEATURES.find(f => f.id === id), [id]);

  if (!feature) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white' }}>
        <h2>Feature not found</h2>
        <Link href="/" style={{ color: '#0d9488', marginTop: '20px' }}>Return Home</Link>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      color: '#0f172a',
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      position: 'relative',
      overflow: 'hidden',
      zoom: 0.75
    }}>
      {/* Dynamic Background Gradients */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: `
          radial-gradient(circle at 20% 30%, ${feature.color}08, transparent 40%),
          radial-gradient(circle at 80% 70%, rgba(13, 148, 136, 0.06), transparent 40%)
        `,
        filter: 'blur(30px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto', padding: '80px 32px' }}>
        
        {/* Back Button */}
        <Link href="/#features" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          color: '#64748b', textDecoration: 'none', fontSize: '15px', fontWeight: 600,
          marginBottom: '50px', transition: 'color 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.color = '#0d9488'}
        onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
        >
          <span>←</span> Back to All Features
        </Link>

        {/* Header Section */}
        <div style={{ display: 'flex', gap: '40px', alignItems: 'center', marginBottom: '60px' }}>
          <div style={{
            width: '100px', height: '100px', flexShrink: 0,
            background: feature.bg,
            border: `1px solid ${feature.border}`,
            borderRadius: '28px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '48px',
            color: feature.color,
            boxShadow: `0 10px 30px ${feature.color}20`
          }}>
            {feature.icon}
          </div>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              background: 'rgba(13,148,136,0.06)',
              border: '1px solid rgba(13,148,136,0.2)',
              color: '#0d9488',
              padding: '6px 16px',
              borderRadius: '30px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: '16px'
            }}>
              Feature Details
            </div>
            <h1 style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: '52px',
              fontWeight: 400,
              lineHeight: 1.1,
              color: '#0f172a',
              letterSpacing: '-0.02em',
              margin: 0
            }}>
              {feature.title}
            </h1>
          </div>
        </div>

        {/* Content Section */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          borderRadius: '24px',
          padding: '48px',
          marginBottom: '60px'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '24px' }}>
            About this feature
          </h2>
          <p style={{ fontSize: '16px', color: '#475569', lineHeight: 1.8, marginBottom: '40px' }}>
            {feature.fullDesc}
          </p>

          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>
            Key Benefits
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {feature.benefits.map((benefit, index) => (
              <li key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '15px', color: '#475569' }}>
                <span style={{ color: '#0d9488', fontSize: '16px', fontWeight: 'bold', marginTop: '2px' }}>✓</span>
                <span style={{ lineHeight: 1.6 }}>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: '60px', padding: '60px 0', borderTop: '1px solid #f1f5f9' }}>
          <h2 style={{ fontFamily: '"DM Serif Display", serif', fontSize: '36px', fontWeight: 400, marginBottom: '30px', color: '#0f172a' }}>
            Experience {feature.title} Today
          </h2>
          <Link href="/register" style={{
            display: 'inline-block',
            background: `linear-gradient(135deg, #0d9488, #3b82f6)`,
            color: '#ffffff', padding: '16px 48px',
            borderRadius: '12px', fontSize: '16px', fontWeight: 800,
            textDecoration: 'none', transition: 'all 0.2s',
            boxShadow: `0 10px 32px rgba(13,148,136,0.3)`,
            fontFamily: '"Plus Jakarta Sans", sans-serif'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Start Free Demo
          </Link>
        </div>
      </div>
    </div>
  );
}

import type { Metadata, Viewport } from 'next'
import { Inter, Outfit, Playfair_Display } from 'next/font/google'
import './globals.css'
import PWAProvider from '@/components/PWAProvider'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800', '900'],
  variable: '--font-outfit',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'MyResidency | Ultimate Multi-Exam CBT Simulator',
  description:
    'A premium subscription-based Computer Based Test simulator covering FCPS Part 1, MCPS, MRCP, MD/MS JCAT, and USMLE. Practice with real-pattern MCQs across all major subjects.',
  keywords: 'FCPS, MCPS, MRCP, JCAT, USMLE, MCQ, CBT, Simulator, Medical, Exam, Pakistan, Residency',
  robots: 'index, follow',
  openGraph: {
    title: 'MyResidency | Ultimate Multi-Exam CBT Simulator',
    description:
      'Access comprehensive digital mock exams, analyze performance, and track your medical residency training progress across FCPS, MCPS, MRCP, JCAT, & USMLE with scholarly precision.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MyResidency | Ultimate Multi-Exam CBT Simulator',
    description: 'Practice FCPS, MCPS, MRCP, JCAT, & USMLE with real-pattern MCQs across all major subjects.',
  },
  // ─── PWA ──────────────────────────────────────────────────────
  // These three blocks are what let Android/iOS install the site as a
  // standalone app (own icon, no browser chrome) instead of a bookmark.
  manifest: '/manifest.json',
  applicationName: 'MyResidency',
  appleWebApp: {
    capable: true,
    title: 'MyResidency',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  formatDetection: {
    telephone: false,
  },
}

// viewportFit:'cover' + the safe-area padding in globals.css is what stops
// content sliding under the notch / gesture bar once installed.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#F9FAFB',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      {/*
        body is display:block (never flex/grid) — globals.css enforces this.
        gradient-bg is redefined in globals.css to bg:#030712, no flex.
        w-full prevents any upstream shrink-wrap.
      */}
      <body className="gradient-bg w-full min-h-screen">
        {children}
        <PWAProvider />
      </body>
    </html>
  )
}

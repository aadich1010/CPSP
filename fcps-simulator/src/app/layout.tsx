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
  title: 'FCPS Part 1 CBT Simulator | Secure Medical Exam Platform',
  description:
    'A premium subscription-based Computer Based Test simulator for FCPS Part 1 examination preparation. Practice with real-pattern MCQs across all major subjects.',
  keywords: 'FCPS, Part 1, MCQ, CBT, Simulator, Medical, Exam, Pakistan',
  robots: 'index, follow',
  openGraph: {
    title: 'FCPS Part 1 CBT Simulator',
    description:
      'Practice FCPS Part 1 with real-pattern MCQs across all major subjects — secure, subscription-based CBT simulator.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FCPS Part 1 CBT Simulator',
    description: 'Practice FCPS Part 1 with real-pattern MCQs across all major subjects.',
  },
  // ─── PWA ──────────────────────────────────────────────────────
  // These three blocks are what let Android/iOS install the site as a
  // standalone app (own icon, no browser chrome) instead of a bookmark.
  manifest: '/manifest.json',
  applicationName: 'FCPS Simulator',
  appleWebApp: {
    capable: true,
    title: 'FCPS Simulator',
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

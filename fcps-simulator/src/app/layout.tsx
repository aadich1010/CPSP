import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'

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

// NOTE: robots was 'noindex, nofollow' (staging default). Flipped to allow
// indexing for public launch. Revert to 'noindex, nofollow' if this is
// still meant to be a private/invite-only deployment.
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
    description:
      'Practice FCPS Part 1 with real-pattern MCQs across all major subjects.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body
        className="gradient-bg min-h-screen"
        style={{ fontFamily: 'var(--font-inter), var(--font-outfit), system-ui, sans-serif' }}
      >
        {children}
      </body>
    </html>
  )
}

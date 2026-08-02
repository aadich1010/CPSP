import type { Metadata } from 'next'
import { Inter, Outfit, Playfair_Display } from 'next/font/google'
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
      </body>
    </html>
  )
}

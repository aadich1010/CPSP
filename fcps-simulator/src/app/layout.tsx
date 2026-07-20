import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FCPS Part 1 CBT Simulator | Secure Medical Exam Platform',
  description:
    'A premium subscription-based Computer Based Test simulator for FCPS Part 1 examination preparation. Practice with real-pattern MCQs across all major subjects.',
  keywords: 'FCPS, Part 1, MCQ, CBT, Simulator, Medical, Exam, Pakistan',
  robots: 'noindex, nofollow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="gradient-bg min-h-screen" style={{ fontFamily: "'Inter', 'Outfit', system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  )
}

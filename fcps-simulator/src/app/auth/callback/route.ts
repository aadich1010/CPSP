import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  // Only allow same-app relative paths -- never redirect off-site based
  // on a query param an attacker could craft. A leading "/" alone isn't
  // enough: "//evil.com" and "/\evil.com" both start with "/" but browsers
  // treat them as protocol-relative URLs and redirect to evil.com. Require
  // a single leading slash NOT followed by another slash or backslash.
  const rawNext = requestUrl.searchParams.get('next') || '/dashboard'
  const next = /^\/(?!\/|\\)/.test(rawNext) ? rawNext : '/dashboard'

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}${next}`)
}

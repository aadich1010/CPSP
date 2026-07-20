import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ── In-memory sliding-window rate limiter ──────────────────────────
// Good enough for a single Vercel region / low-to-mid traffic. If you
// scale to multiple regions or need it to survive cold starts, swap
// this Map for Upstash Redis (@upstash/ratelimit) — same interface.
const RATE_LIMIT_WINDOW_MS = 1000
const RATE_LIMIT_MAX = 5 // 5 req/sec/IP, matches the requirement
const buckets = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }
  bucket.count += 1
  return bucket.count > RATE_LIMIT_MAX
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

const RATE_LIMITED_PATHS = ['/login', '/register']

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (
    request.method === 'POST' &&
    RATE_LIMITED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    const ip = getClientIp(request)
    if (isRateLimited(`${pathname}:${ip}`)) {
      return new NextResponse(JSON.stringify({ error: 'Too many requests. Please slow down.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '1' },
      })
    }
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const publicRoutes = ['/login', '/register', '/auth/callback', '/']
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith('/auth/')
  )
  const isAdminRoute = pathname.startsWith('/admin')
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/exam')

  if (!user && (isProtectedRoute || isAdminRoute)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && (isProtectedRoute || isAdminRoute)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, subscription_status, subscription_expires_at')
      .eq('id', user.id)
      .single()

    if (!profile) {
      const response = NextResponse.redirect(new URL('/login?error=missing_profile', request.url))
      response.cookies.delete(
        'sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL!.split('//')[1].split('.')[0] + '-auth-token'
      )
      return response
    }

    if (isAdminRoute && profile.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    if (isProtectedRoute && profile.role !== 'admin') {
      const isActive = profile.subscription_status === 'active'
      const notExpired =
        !profile.subscription_expires_at || new Date(profile.subscription_expires_at) > new Date()

      if (!isActive || !notExpired) {
        const url = request.nextUrl.clone()
        url.pathname = '/subscription-expired'
        return NextResponse.redirect(url)
      }
    }
  }

  if (user && (pathname === '/login' || pathname === '/register')) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const url = request.nextUrl.clone()
    url.pathname = profile?.role === 'admin' ? '/admin/users' : '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ── In-memory sliding-window rate limiter ──────────────────────────
// Good enough for a single Vercel region / low-to-mid traffic. If you
// scale to multiple regions or need it to survive cold starts, swap
// this Map for Upstash Redis (@upstash/ratelimit) — same interface.
const RATE_LIMIT_WINDOW_MS = 1000
const RATE_LIMIT_MAX = 5 // 5 req/sec/IP, matches the requirement
const buckets = new Map<string, { count: number; resetAt: number }>()

// Test-only escape hatch — clears in-memory bucket state between test cases
// so tests don't leak rate-limit counters into each other.
export function __resetRateLimitBucketsForTests() {
  buckets.clear()
}

export function isRateLimited(key: string): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }
  bucket.count += 1
  return bucket.count > RATE_LIMIT_MAX
}

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

const RATE_LIMITED_PATHS = ['/login', '/register', '/forgot-password']

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
    // The role is needed before the device-session check below (admins are
    // exempt from it), so this lookup now runs first. Same single query as
    // before -- only its position moved.
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

    // ── Device-session gatekeeper (fast path) ──────────────────────────
    // Runs on EVERY request to a protected/admin route, including plain
    // page navigations that never touch a Server Action -- which is why
    // this check uses the live `User-Agent` request header (always
    // present) rather than the full fingerprint (User-Agent + screen res
    // + per-login id), which only travels on explicit Server Action calls
    // (login, and DeviceSessionGuard's periodic validateDeviceFingerprint
    // ping -- see src/components/DeviceSessionGuard.tsx for that stronger,
    // precise check). A mismatch here means either this account's one
    // device slot was released elsewhere (logout, logout-all, the 24h
    // cleanup cron) or this specific request is coming from a different
    // browser than the one that holds the slot -- both cases: force a
    // clean sign-out rather than let a stale/foreign session limp along.
    //
    // Admins are skipped: login() never claims a slot for them (see
    // app/auth/actions.ts), so they hold no active_sessions row at all --
    // running this check on them would take the `!deviceSession` branch
    // and sign the operator out on every single admin page load.
    if (profile.role !== 'admin') {
      const { data: deviceSession } = await supabase
        .from('active_sessions')
        .select('device_user_agent')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      const liveUserAgent = request.headers.get('user-agent') || ''

      if (!deviceSession || deviceSession.device_user_agent !== liveUserAgent) {
        // Manually clear the auth cookie on the response we're actually
        // returning, the same way the "!profile" branch above does --
        // supabase.auth.signOut() here would instead mutate the (discarded)
        // `supabaseResponse` closure variable via the cookies.setAll callback
        // above, and that update would never reach the client on a response
        // object we don't return.
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('error', deviceSession ? 'device_mismatch' : 'session_ended')
        const response = NextResponse.redirect(url)
        response.cookies.delete(
          'sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL!.split('//')[1].split('.')[0] + '-auth-token'
        )
        return response
      }
    }

    if (isAdminRoute && profile.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    if (isProtectedRoute && profile.role !== 'admin') {
      // 'demo' is the free, no-approval-needed trial tier every new
      // signup lands in (see supabase/migrations/20260724000000_demo_account_signup.sql).
      // It gets through here same as 'active' -- the actual feature
      // limits (10 questions, 4 subjects) are enforced further down the
      // chain (exam/setup's SUBJECTS list, and get_exam_questions()
      // server-side). Only 'pending' (manually held by an admin) and
      // 'expired' are blocked here.
      const hasAccess = profile.subscription_status === 'active' || profile.subscription_status === 'demo'
      const notExpired =
        !profile.subscription_expires_at || new Date(profile.subscription_expires_at) > new Date()

      if (!hasAccess || !notExpired) {
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

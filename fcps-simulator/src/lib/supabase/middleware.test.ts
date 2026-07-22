import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// updateSession() calls createServerClient() from @supabase/ssr. Mock it so
// we can control exactly what "the logged-in user" and their profile row
// look like for each test case, without touching a real Supabase project.
const mockGetUser = vi.fn()
const mockSingle = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: mockSingle,
        }),
      }),
    }),
  })),
}))

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project-ref.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'

const { isRateLimited, getClientIp, updateSession, __resetRateLimitBucketsForTests } = await import(
  './middleware'
)

function makeReq(path: string, method: 'GET' | 'POST' = 'GET') {
  return new NextRequest(`https://example.com${path}`, { method })
}

describe('isRateLimited', () => {
  beforeEach(() => {
    __resetRateLimitBucketsForTests()
  })

  it('allows the first 5 requests in a window', () => {
    const key = 'test-key-allow'
    for (let i = 0; i < 5; i++) {
      expect(isRateLimited(key)).toBe(false)
    }
  })

  it('blocks the 6th request within the same 1s window', () => {
    const key = 'test-key-block'
    for (let i = 0; i < 5; i++) isRateLimited(key)
    expect(isRateLimited(key)).toBe(true)
  })

  it('tracks separate keys independently (per-path, per-IP)', () => {
    const keyA = 'a:1.2.3.4'
    const keyB = 'b:1.2.3.4'
    for (let i = 0; i < 5; i++) isRateLimited(keyA)
    // keyB should still have its own fresh bucket
    expect(isRateLimited(keyB)).toBe(false)
    // but keyA is now over its limit
    expect(isRateLimited(keyA)).toBe(true)
  })

  it('resets the count after the window elapses', () => {
    vi.useFakeTimers()
    const key = 'test-key-reset'
    for (let i = 0; i < 5; i++) isRateLimited(key)
    expect(isRateLimited(key)).toBe(true)

    vi.advanceTimersByTime(1001)
    expect(isRateLimited(key)).toBe(false)
    vi.useRealTimers()
  })
})

describe('getClientIp', () => {
  function makeRequest(headers: Record<string, string>): NextRequest {
    return {
      headers: {
        get: (name: string) => headers[name.toLowerCase()] ?? null,
      },
    } as unknown as NextRequest
  }

  it('prefers the first IP in x-forwarded-for', () => {
    const req = makeRequest({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2' })
    expect(getClientIp(req)).toBe('1.1.1.1')
  })

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = makeRequest({ 'x-real-ip': '3.3.3.3' })
    expect(getClientIp(req)).toBe('3.3.3.3')
  })

  it('falls back to "unknown" when no IP headers are present', () => {
    const req = makeRequest({})
    expect(getClientIp(req)).toBe('unknown')
  })
})

describe('updateSession route gating', () => {
  beforeEach(() => {
    __resetRateLimitBucketsForTests()
    mockGetUser.mockReset()
    mockSingle.mockReset()
  })

  it('redirects an unauthenticated visitor away from /dashboard to /login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await updateSession(makeReq('/dashboard'))
    expect(res.status).toBe(307)
    expect(new URL(res.headers.get('location')!).pathname).toBe('/login')
  })

  it('redirects an unauthenticated visitor away from /admin to /login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await updateSession(makeReq('/admin/users'))
    expect(new URL(res.headers.get('location')!).pathname).toBe('/login')
  })

  it('lets an authenticated student with an active, unexpired subscription through to /dashboard', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockSingle.mockResolvedValue({
      data: {
        role: 'student',
        subscription_status: 'active',
        subscription_expires_at: new Date(Date.now() + 86_400_000).toISOString(),
      },
    })
    const res = await updateSession(makeReq('/dashboard'))
    // NextResponse.next() carries no redirect Location header.
    expect(res.headers.get('location')).toBeNull()
  })

  it('redirects a student whose subscription_status is not active to /subscription-expired', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockSingle.mockResolvedValue({
      data: { role: 'student', subscription_status: 'pending', subscription_expires_at: null },
    })
    const res = await updateSession(makeReq('/dashboard'))
    expect(new URL(res.headers.get('location')!).pathname).toBe('/subscription-expired')
  })

  it('redirects a student whose subscription_expires_at is in the past to /subscription-expired, even if status still says active', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockSingle.mockResolvedValue({
      data: {
        role: 'student',
        subscription_status: 'active',
        subscription_expires_at: new Date(Date.now() - 1000).toISOString(),
      },
    })
    const res = await updateSession(makeReq('/exam/session-123'))
    expect(new URL(res.headers.get('location')!).pathname).toBe('/subscription-expired')
  })

  it('never gates admins on subscription status, even if their profile row has no active subscription', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } } })
    mockSingle.mockResolvedValue({
      data: { role: 'admin', subscription_status: 'expired', subscription_expires_at: null },
    })
    const res = await updateSession(makeReq('/exam/session-123'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('redirects a logged-in non-admin away from /admin to /dashboard, without ever reaching the subscription check', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockSingle.mockResolvedValue({
      data: { role: 'student', subscription_status: 'expired', subscription_expires_at: null },
    })
    const res = await updateSession(makeReq('/admin/users'))
    expect(new URL(res.headers.get('location')!).pathname).toBe('/dashboard')
  })

  it('logs a user out and sends them to /login when their auth session has no matching profiles row', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'ghost-1' } } })
    mockSingle.mockResolvedValue({ data: null })
    const res = await updateSession(makeReq('/dashboard'))
    const url = new URL(res.headers.get('location')!)
    expect(url.pathname).toBe('/login')
    expect(url.searchParams.get('error')).toBe('missing_profile')
  })

  it('bounces an already-authenticated user away from /login back to /dashboard', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockSingle.mockResolvedValue({ data: { role: 'student' } })
    const res = await updateSession(makeReq('/login'))
    expect(new URL(res.headers.get('location')!).pathname).toBe('/dashboard')
  })

  it('bounces an already-authenticated admin away from /register to /admin/users', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } } })
    mockSingle.mockResolvedValue({ data: { role: 'admin' } })
    const res = await updateSession(makeReq('/register'))
    expect(new URL(res.headers.get('location')!).pathname).toBe('/admin/users')
  })

  it('applies the POST rate limiter before ever calling Supabase', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    for (let i = 0; i < 5; i++) {
      await updateSession(makeReq('/login', 'POST'))
    }
    const res = await updateSession(makeReq('/login', 'POST'))
    expect(res.status).toBe(429)
    // The 6th call was rejected by the rate limiter, so getUser was never
    // reached for that call — only the previous 5 calls hit it.
    expect(mockGetUser).toHaveBeenCalledTimes(5)
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockExchangeCodeForSession = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { exchangeCodeForSession: mockExchangeCodeForSession },
  })),
}))

function locationOf(response: Response) {
  return response.headers.get('location')
}

describe('GET /auth/callback', () => {
  beforeEach(() => {
    mockExchangeCodeForSession.mockReset()
    mockExchangeCodeForSession.mockResolvedValue({ data: {}, error: null })
  })

  it('redirects to /dashboard by default when no "next" is given', async () => {
    const { GET } = await import('./route')
    const req = new NextRequest('https://app.example.com/auth/callback?code=abc123')
    const res = await GET(req)
    expect(locationOf(res)).toBe('https://app.example.com/dashboard')
  })

  it('honors a legitimate same-app "next" path', async () => {
    const { GET } = await import('./route')
    const req = new NextRequest(
      'https://app.example.com/auth/callback?code=abc123&next=/reset-password'
    )
    const res = await GET(req)
    expect(locationOf(res)).toBe('https://app.example.com/reset-password')
  })

  // Regression test for the protocol-relative-URL open redirect: "//host"
  // starts with "/" but browsers treat a Location of "https://app.example.com//evil.com"
  // ... actually resolve it as evil.com because "//" after the origin is
  // parsed as a new authority. Must fall back to /dashboard instead.
  it('rejects a protocol-relative "next" (open redirect via //host)', async () => {
    const { GET } = await import('./route')
    const req = new NextRequest(
      'https://app.example.com/auth/callback?code=abc123&next=//evil.com/phish'
    )
    const res = await GET(req)
    expect(locationOf(res)).toBe('https://app.example.com/dashboard')
  })

  it('rejects a backslash-prefixed "next" (another protocol-relative bypass)', async () => {
    const { GET } = await import('./route')
    const req = new NextRequest(
      'https://app.example.com/auth/callback?code=abc123&next=/\\evil.com'
    )
    const res = await GET(req)
    expect(locationOf(res)).toBe('https://app.example.com/dashboard')
  })

  it('rejects an absolute off-site "next" URL', async () => {
    const { GET } = await import('./route')
    const req = new NextRequest(
      'https://app.example.com/auth/callback?code=abc123&next=https://evil.com/phish'
    )
    const res = await GET(req)
    expect(locationOf(res)).toBe('https://app.example.com/dashboard')
  })

  it('still redirects to /dashboard if code exchange fails, rather than throwing', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: {},
      error: { message: 'invalid code' },
    })
    const { GET } = await import('./route')
    const req = new NextRequest('https://app.example.com/auth/callback?code=bad-code')
    const res = await GET(req)
    expect(locationOf(res)).toBe('https://app.example.com/dashboard')
  })
})

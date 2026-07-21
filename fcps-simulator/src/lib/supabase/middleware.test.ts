import { describe, it, expect, beforeEach, vi } from 'vitest'
import { isRateLimited, getClientIp, __resetRateLimitBucketsForTests } from './middleware'
import type { NextRequest } from 'next/server'

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

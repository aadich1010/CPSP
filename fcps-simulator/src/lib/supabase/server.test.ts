import { describe, it, expect, vi, beforeEach } from 'vitest'

// requireAdmin() calls createClient(), which calls next/headers' cookies()
// and @supabase/ssr's createServerClient(). Mock both so we can control
// exactly what "the logged-in user" looks like for each test case,
// without touching a real Supabase project.
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    set: () => {},
  })),
}))

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

describe('requireAdmin', () => {
  beforeEach(() => {
    vi.resetModules()
    mockGetUser.mockReset()
    mockSingle.mockReset()
  })

  it('throws UNAUTHORIZED when there is no session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { requireAdmin } = await import('./server')
    await expect(requireAdmin()).rejects.toThrow('UNAUTHORIZED')
  })

  it('throws FORBIDDEN when the user is logged in but not an admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockSingle.mockResolvedValue({ data: { role: 'student' } })
    const { requireAdmin } = await import('./server')
    await expect(requireAdmin()).rejects.toThrow('FORBIDDEN')
  })

  it('throws FORBIDDEN when the profile row is missing entirely', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockSingle.mockResolvedValue({ data: null })
    const { requireAdmin } = await import('./server')
    await expect(requireAdmin()).rejects.toThrow('FORBIDDEN')
  })

  it('returns the user when role is admin', async () => {
    const adminUser = { id: 'admin-1' }
    mockGetUser.mockResolvedValue({ data: { user: adminUser } })
    mockSingle.mockResolvedValue({ data: { role: 'admin' } })
    const { requireAdmin } = await import('./server')
    await expect(requireAdmin()).resolves.toEqual(adminUser)
  })
})

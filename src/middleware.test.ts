import { describe, it, expect, vi } from 'vitest'
import { middleware } from './middleware'
import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Mock Supabase SSR - createServerClient must itself be a vi.fn(), not a
// plain arrow function, otherwise vi.mocked(...).mockReturnValueOnce()
// below has nothing real to call (vi.mocked only narrows the type, it
// doesn't turn a plain function into a mock at runtime).
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: '123' } } }),
    },
  })),
}))

describe('Middleware Role Gate', () => {
  it('blocks doctor from accessing admin routes', async () => {
    const req = new NextRequest('http://localhost/admin/dashboard')
    // Simulate the user_role cookie
    req.cookies.set('user_role', 'doctor')

    const res = await middleware(req)

    // Should redirect to login
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost/login')
  })

  it('allows doctor to access doctor routes', async () => {
    const req = new NextRequest('http://localhost/doctor/dashboard')
    req.cookies.set('user_role', 'doctor')

    const res = await middleware(req)

    // 200 Next response, no redirect
    expect(res.status).toBe(200)
    expect(res.headers.get('x-middleware-next')).toBe('1')
  })

  it('blocks unauthenticated user from accessing doctor routes', async () => {
    // Override the mock for this test only - mockReturnValueOnce keeps
    // vitest's proper typing, unlike reassigning the mock property
    // directly (which is what TypeScript was rejecting here).
    vi.mocked(createServerClient).mockReturnValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const req = new NextRequest('http://localhost/doctor/dashboard')
    const res = await middleware(req)

    // Should redirect to login
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost/login')
  })
})

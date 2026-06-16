import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from './useAuth'

const mockMe = vi.hoisted(() => vi.fn())

vi.mock('@/services/api', () => ({
  authService: {
    me: mockMe,
  },
}))

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('returns user as null when no token', async () => {
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user).toBeNull()
  })
})

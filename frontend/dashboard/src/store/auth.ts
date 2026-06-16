import { create } from 'zustand'
import type { User } from '@/types/waybill'
import { authService } from '@/services/api'

interface AuthState {
  token: string | null
  user: User | null
  loading: boolean
  setToken: (t: string | null) => void
  setUser: (u: User | null) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loadUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('access_token'),
  user: null,
  loading: true,

  setToken: (t) => {
    if (t) localStorage.setItem('access_token', t)
    else localStorage.removeItem('access_token')
    set({ token: t })
  },

  setUser: (u) => set({ user: u }),

  login: async (email, password) => {
    const res = await authService.login(email, password)
    const { accessToken, user } = res.data
    localStorage.setItem('access_token', accessToken)
    set({ token: accessToken, user })
  },

  logout: () => {
    localStorage.removeItem('access_token')
    set({ token: null, user: null })
  },

  loadUser: async () => {
    const { token } = get()

    if (!token) {
      set({ loading: false })

      return
    }

    try {
      const res = await authService.me()
      set({ user: res.data, loading: false })
    } catch {
      localStorage.removeItem('access_token')
      set({ token: null, user: null, loading: false })
    }
  },
}))
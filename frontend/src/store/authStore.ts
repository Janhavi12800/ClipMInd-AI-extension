import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi, clearStoredSession, getStoredToken, type ProfileData } from '@/lib/auth'
import { currentUser, organization as mockOrg } from '@/data/mockData'
import type { Organization, User } from '@/types'

function profileToUser(profile: ProfileData): User {
  const org = profile.organizations
  return {
    id: profile.id,
    email: profile.email ?? '',
    name: profile.full_name ?? profile.email?.split('@')[0] ?? 'User',
    avatar: profile.avatar_url ?? '',
    role: profile.role ?? 'Member',
    department: profile.department ?? '',
    plan: (profile.plan as User['plan']) ?? 'free',
    organization: org?.name ?? '',
    joinedAt: profile.created_at,
    lastActive: new Date().toISOString(),
    timezone: profile.timezone ?? 'UTC',
    locale: profile.locale ?? 'en-US',
    mfaEnabled: false,
    apiUsage: 0,
    apiLimit: profile.plan === 'pro' ? 100000 : profile.plan === 'business' ? 500000 : 10000,
  }
}

function profileToOrg(profile: ProfileData): Organization {
  const org = profile.organizations
  if (!org) return mockOrg
  return {
    id: org.id,
    name: org.name,
    domain: org.domain ?? '',
    plan: (org.plan as Organization['plan']) ?? 'free',
    seats: org.seats,
    seatsUsed: 1,
    ssoEnabled: org.sso_enabled,
  }
}

interface AuthState {
  user: User
  organization: Organization
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  initialize: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  updateUser: (partial: Partial<User>) => void
  saveProfile: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: currentUser,
      organization: mockOrg,
      isAuthenticated: false,
      loading: false,
      error: null,

      initialize: async () => {
        const token = getStoredToken()
        if (!token) {
          set({ isAuthenticated: false })
          return
        }
        set({ loading: true, error: null })
        try {
          const { profile } = await authApi.me()
          set({
            user: profileToUser(profile),
            organization: profileToOrg(profile),
            isAuthenticated: true,
            loading: false,
          })
        } catch {
          clearStoredSession()
          set({ isAuthenticated: false, loading: false })
        }
      },

      login: async (email, password) => {
        set({ loading: true, error: null })
        try {
          await authApi.login(email, password)
          const { profile } = await authApi.me()
          set({
            user: profileToUser(profile),
            organization: profileToOrg(profile),
            isAuthenticated: true,
            loading: false,
          })
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Login failed',
            loading: false,
          })
          throw err
        }
      },

      register: async (email, password, name) => {
        set({ loading: true, error: null })
        try {
          const result = await authApi.register(email, password, name)
          if (result.session) {
            const { profile } = await authApi.me()
            set({
              user: profileToUser(profile),
              organization: profileToOrg(profile),
              isAuthenticated: true,
            })
          }
          set({ loading: false })
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Registration failed',
            loading: false,
          })
          throw err
        }
      },

      loginWithGoogle: async () => {
        const { url } = await authApi.getGoogleUrl()
        window.location.href = url
      },

      updateUser: (partial) =>
        set((state) => ({ user: { ...state.user, ...partial } })),

      saveProfile: async () => {
        const { user } = get()
        const { api } = await import('@/lib/api')
        await api.updateProfile({
          full_name: user.name,
          role: user.role,
          department: user.department,
          timezone: user.timezone,
          locale: user.locale,
        })
      },

      logout: async () => {
        await authApi.logout()
        set({ isAuthenticated: false, user: currentUser, organization: mockOrg })
      },
    }),
    {
      name: 'techshield-auth',
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated }),
    },
  ),
)

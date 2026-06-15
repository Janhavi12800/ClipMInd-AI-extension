import { create } from 'zustand'
import { currentUser, organization } from '@/data/mockData'
import type { Organization, User } from '@/types'

interface AuthState {
  user: User
  organization: Organization
  isAuthenticated: boolean
  updateUser: (partial: Partial<User>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: currentUser,
  organization,
  isAuthenticated: true,

  updateUser: (partial) =>
    set((state) => ({
      user: { ...state.user, ...partial },
    })),

  logout: () =>
    set({
      isAuthenticated: false,
    }),
}))

import { create } from 'zustand'
import { api, payments, type SubscriptionPlan, type UserSubscription } from '@/lib/api'

interface BillingState {
  plans: SubscriptionPlan[]
  subscription: UserSubscription | null
  loading: boolean
  error: string | null
  fetchPlans: () => Promise<void>
  fetchSubscription: () => Promise<void>
  startCheckout: (
    tier: string,
    provider: 'stripe' | 'razorpay',
    interval: 'monthly' | 'yearly',
  ) => Promise<void>
  openPortal: () => Promise<void>
  cancelSubscription: () => Promise<void>
  activateFree: () => Promise<void>
}

export const useBillingStore = create<BillingState>((set, get) => ({
  plans: [],
  subscription: null,
  loading: false,
  error: null,

  fetchPlans: async () => {
    set({ loading: true, error: null })
    try {
      const plans = await api.getPlans()
      set({ plans: plans.filter((p) => ['free', 'pro', 'business'].includes(p.tier)) })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load plans' })
    } finally {
      set({ loading: false })
    }
  },

  fetchSubscription: async () => {
    set({ loading: true, error: null })
    try {
      const subscription = await api.getSubscription()
      set({ subscription })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load subscription' })
    } finally {
      set({ loading: false })
    }
  },

  startCheckout: async (tier, provider, interval) => {
    set({ loading: true, error: null })
    try {
      const base = window.location.origin
      const { checkout_url } = await payments.checkout({
        plan_tier: tier,
        provider,
        interval,
        success_url: `${base}/billing?success=true`,
        cancel_url: `${base}/billing?canceled=true`,
      })
      window.location.href = checkout_url
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Checkout failed',
        loading: false,
      })
    }
  },

  openPortal: async () => {
    set({ loading: true, error: null })
    try {
      const { portal_url } = await payments.portal(`${window.location.origin}/billing`)
      window.location.href = portal_url
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Portal unavailable',
        loading: false,
      })
    }
  },

  cancelSubscription: async () => {
    set({ loading: true, error: null })
    try {
      await payments.cancel()
      await get().fetchSubscription()
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Cancel failed' })
    } finally {
      set({ loading: false })
    }
  },

  activateFree: async () => {
    set({ loading: true, error: null })
    try {
      await payments.activateFree()
      await get().fetchSubscription()
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Activation failed' })
    } finally {
      set({ loading: false })
    }
  },
}))

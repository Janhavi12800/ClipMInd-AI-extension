import { useEffect } from 'react'
import { Check, CreditCard, Globe, Loader2, Shield, Zap } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui'
import { useBillingStore } from '@/store/billingStore'
import { formatPrice } from '@/lib/api'
import { cn } from '@/lib/utils'

const TIER_ICONS = {
  free: Shield,
  pro: Zap,
  business: Globe,
} as const

export function BillingPage() {
  const {
    plans,
    subscription,
    loading,
    error,
    fetchPlans,
    fetchSubscription,
    startCheckout,
    openPortal,
    cancelSubscription,
    activateFree,
  } = useBillingStore()

  useEffect(() => {
    fetchPlans()
    fetchSubscription()
  }, [fetchPlans, fetchSubscription])

  const currentTier = subscription?.subscription_plans?.tier ?? 'free'

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="Billing & Plans"
        description="Manage your subscription, payment method, and invoices"
      />

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {subscription && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>
              {subscription.subscription_plans?.name ?? 'Free'} plan
              {subscription.cancel_at_period_end && ' — cancels at period end'}
            </CardDescription>
          </CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="brand">{subscription.status}</Badge>
            <Badge variant="default">{subscription.payment_provider}</Badge>
            {subscription.current_period_end && (
              <span className="text-sm text-app-muted">
                Renews {new Date(subscription.current_period_end).toLocaleDateString()}
              </span>
            )}
            <div className="ml-auto flex gap-2">
              {subscription.payment_provider === 'stripe' && (
                <Button variant="secondary" size="sm" onClick={openPortal} disabled={loading}>
                  Manage Billing
                </Button>
              )}
              {currentTier !== 'free' && !subscription.cancel_at_period_end && (
                <Button variant="danger" size="sm" onClick={cancelSubscription} disabled={loading}>
                  Cancel Plan
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const Icon = TIER_ICONS[plan.tier as keyof typeof TIER_ICONS] ?? Shield
          const isCurrent = currentTier === plan.tier
          const features = Array.isArray(plan.features) ? plan.features : []

          return (
            <Card
              key={plan.id}
              className={cn(
                'relative flex flex-col',
                plan.tier === 'pro' && 'border-brand-500 ring-1 ring-brand-500/20',
                isCurrent && 'bg-brand-50/50 dark:bg-brand-900/10',
              )}
            >
              {plan.tier === 'pro' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="brand">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600/10">
                  <Icon className="h-6 w-6 text-brand-600" />
                </div>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-app">
                    {plan.price_monthly_cents === 0
                      ? 'Free'
                      : formatPrice(plan.price_monthly_cents, plan.currency)}
                  </span>
                  {plan.price_monthly_cents > 0 && (
                    <span className="text-app-muted">/month</span>
                  )}
                </div>
                {plan.price_yearly_cents > 0 && (
                  <p className="mt-1 text-xs text-app-muted">
                    or {formatPrice(plan.price_yearly_cents, plan.currency)}/year (save{' '}
                    {Math.round(
                      (1 - plan.price_yearly_cents / (plan.price_monthly_cents * 12)) * 100,
                    )}
                    %)
                  </p>
                )}
              </CardHeader>

              <ul className="mb-6 flex-1 space-y-2 px-6">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-app-secondary">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="space-y-2 p-6 pt-0">
                {isCurrent ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : plan.tier === 'free' ? (
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={activateFree}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Switch to Free'}
                  </Button>
                ) : (
                  <>
                    <Button
                      className="w-full"
                      onClick={() => startCheckout(plan.tier, 'stripe', 'monthly')}
                      disabled={loading}
                    >
                      <CreditCard className="h-4 w-4" />
                      Subscribe with Stripe
                    </Button>
                    <Button
                      className="w-full"
                      variant="secondary"
                      onClick={() => startCheckout(plan.tier, 'razorpay', 'monthly')}
                      disabled={loading}
                    >
                      Pay with Razorpay
                    </Button>
                  </>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {loading && plans.length === 0 && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      )}
    </div>
  )
}

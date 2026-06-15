import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Mail,
  Building2,
  Calendar,
  Clock,
  Shield,
  Key,
  CreditCard,
  LogOut,
} from 'lucide-react'
import { useAuthStore } from '@/store'
import { PageHeader } from '@/components/layout'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Progress,
} from '@/components/ui'

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, organization, updateUser, saveProfile, logout } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const usagePercent = Math.round((user.apiUsage / user.apiLimit) * 100)

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Profile"
        description="Manage your account information and subscription"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card className="text-center">
            <div className="flex flex-col items-center py-4">
              <Avatar name={user.name} size="xl" />
              <h2 className="mt-4 text-xl font-bold text-app">{user.name}</h2>
              <p className="text-sm text-app-secondary">{user.role}</p>
              <p className="text-sm text-app-muted">{user.department}</p>
              <div className="mt-3 flex gap-2">
                <Badge variant="brand">{user.plan.toUpperCase()}</Badge>
                {user.mfaEnabled && (
                  <Badge variant="success" dot>MFA Enabled</Badge>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader className="mb-2">
              <CardTitle className="text-sm">Organization</CardTitle>
            </CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-app-tertiary">
                <Building2 className="h-5 w-5 text-app-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium text-app">{organization.name}</p>
                <p className="text-xs text-app-muted">{organization.domain}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-app-muted">Plan</span>
                <Badge variant="brand">{organization.plan}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-app-muted">Seats</span>
                <span className="text-app">
                  {organization.seatsUsed} / {organization.seats}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-app-muted">SSO</span>
                <Badge variant={organization.ssoEnabled ? 'success' : 'default'}>
                  {organization.ssoEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Full Name"
                value={user.name}
                onChange={(e) => updateUser({ name: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={user.email}
                onChange={(e) => updateUser({ email: e.target.value })}
                leftIcon={<Mail className="h-4 w-4" />}
              />
              <Input
                label="Role"
                value={user.role}
                onChange={(e) => updateUser({ role: e.target.value })}
              />
              <Input
                label="Department"
                value={user.department}
                onChange={(e) => updateUser({ department: e.target.value })}
              />
              <Input
                label="Timezone"
                value={user.timezone}
                onChange={(e) => updateUser({ timezone: e.target.value })}
                leftIcon={<Clock className="h-4 w-4" />}
              />
              <Input
                label="Locale"
                value={user.locale}
                onChange={(e) => updateUser({ locale: e.target.value })}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              {saveMsg && <span className="text-sm text-green-600">{saveMsg}</span>}
              <Button
                disabled={saving}
                onClick={async () => {
                  setSaving(true)
                  try {
                    await saveProfile()
                    setSaveMsg('Saved')
                    setTimeout(() => setSaveMsg(''), 2000)
                  } catch {
                    setSaveMsg('Saved locally')
                  } finally {
                    setSaving(false)
                  }
                }}
              >
                Save Changes
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Usage</CardTitle>
              <CardDescription>Monthly token allocation for AI features</CardDescription>
            </CardHeader>
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-app">
                    {user.apiUsage.toLocaleString()}
                  </p>
                  <p className="text-sm text-app-muted">
                    of {user.apiLimit.toLocaleString()} tokens used
                  </p>
                </div>
                <Badge variant={usagePercent > 80 ? 'warning' : 'brand'}>
                  {usagePercent}%
                </Badge>
              </div>
              <Progress value={usagePercent} />
              <p className="text-xs text-app-muted">
                Resets on the 1st of each month. Upgrade to Team for pooled tokens.
              </p>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card hover className="cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Key className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-app">Security</p>
                  <p className="text-xs text-app-muted">MFA, password, sessions</p>
                </div>
              </div>
            </Card>

            <Card hover className="cursor-pointer" onClick={() => navigate('/billing')}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-app">Billing</p>
                  <p className="text-xs text-app-muted">Plan, invoices, payment</p>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader className="mb-2">
              <CardTitle className="text-sm">Account Details</CardTitle>
            </CardHeader>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-app-muted" />
                <div>
                  <dt className="text-app-muted">Member since</dt>
                  <dd className="font-medium text-app">
                    {new Date(user.joinedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-app-muted" />
                <div>
                  <dt className="text-app-muted">User ID</dt>
                  <dd className="font-mono text-xs text-app">{user.id}</dd>
                </div>
              </div>
            </dl>
          </Card>

          <div className="flex justify-end">
            <Button
              variant="danger"
              onClick={async () => {
                await logout()
                navigate('/login')
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

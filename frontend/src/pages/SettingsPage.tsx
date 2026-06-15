import { useEffect } from 'react'
import {
  Bell,
  Shield,
  Sparkles,
  Globe,
  Monitor,
  RotateCcw,
} from 'lucide-react'
import { useSettingsStore, useThemeStore } from '@/store'
import { PageHeader } from '@/components/layout'
import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  Switch,
} from '@/components/ui'

export function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettingsStore()
  const { setTheme } = useThemeStore()

  useEffect(() => {
    setTheme(settings.theme)
  }, [settings.theme, setTheme])

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Settings"
        description="Manage your TechShield AI preferences and security configuration"
        actions={
          <Button variant="outline" size="sm" onClick={resetSettings}>
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
        }
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/10">
                <Monitor className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel of your workspace</CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="space-y-4">
            <Select
              label="Theme"
              value={settings.theme}
              onChange={(v) => updateSettings({ theme: v as typeof settings.theme })}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System' },
              ]}
            />
            <Switch
              label="Compact Mode"
              description="Reduce spacing and padding for denser information display"
              checked={settings.compactMode}
              onChange={(v) => updateSettings({ compactMode: v })}
            />
            <Select
              label="Language"
              value={settings.language}
              onChange={(v) => updateSettings({ language: v })}
              options={[
                { value: 'en-US', label: 'English (US)' },
                { value: 'en-GB', label: 'English (UK)' },
                { value: 'es-ES', label: 'Spanish' },
                { value: 'de-DE', label: 'German' },
                { value: 'fr-FR', label: 'French' },
              ]}
            />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle>AI Configuration</CardTitle>
                <CardDescription>Control AI behavior and data handling</CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="space-y-4">
            <Select
              label="Default AI Model"
              value={settings.defaultAiModel}
              onChange={(v) => updateSettings({ defaultAiModel: v as typeof settings.defaultAiModel })}
              options={[
                { value: 'fast', label: 'Fast (GPT-4o-mini) — Lower cost, quicker responses' },
                { value: 'quality', label: 'Quality (GPT-4o) — Best output, higher cost' },
              ]}
            />
            <Switch
              label="PII Redaction"
              description="Automatically detect and redact personally identifiable information before sending to AI"
              checked={settings.piiRedaction}
              onChange={(v) => updateSettings({ piiRedaction: v })}
            />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle>Security</CardTitle>
                <CardDescription>Browser protection and threat detection settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="space-y-4">
            <Switch
              label="Auto-Scan Pages"
              description="Automatically run security checks when visiting new websites"
              checked={settings.autoScan}
              onChange={(v) => updateSettings({ autoScan: v })}
            />
            <Select
              label="Phishing Detection Sensitivity"
              value={settings.phishingSensitivity}
              onChange={(v) =>
                updateSettings({ phishingSensitivity: v as typeof settings.phishingSensitivity })
              }
              options={[
                { value: 'low', label: 'Low — Fewer warnings, may miss some threats' },
                { value: 'medium', label: 'Medium — Balanced detection (recommended)' },
                { value: 'high', label: 'High — Maximum protection, more false positives' },
              ]}
            />
            <Switch
              label="Security Alerts"
              description="Show real-time notifications for detected threats"
              checked={settings.securityAlerts}
              onChange={(v) => updateSettings({ securityAlerts: v })}
            />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Email and in-app notification preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="space-y-4">
            <Switch
              label="Email Notifications"
              description="Receive email updates about your account and scans"
              checked={settings.emailNotifications}
              onChange={(v) => updateSettings({ emailNotifications: v })}
            />
            <Switch
              label="Weekly Digest"
              description="Summary of your activity, threats blocked, and AI usage"
              checked={settings.weeklyDigest}
              onChange={(v) => updateSettings({ weeklyDigest: v })}
            />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle>Extension</CardTitle>
                <CardDescription>Chrome extension configuration</CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="rounded-lg bg-app-tertiary p-4 text-sm text-app-secondary">
            <p>
              Extension version <strong className="text-app">1.0.0</strong> is installed and synced.
              Last sync: just now.
            </p>
            <p className="mt-2">
              Device ID: <code className="rounded bg-app-elevated px-1.5 py-0.5 text-xs font-mono">ext_8f3k2m9x_chrome</code>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

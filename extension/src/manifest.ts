import type { ManifestV3Export } from '@crxjs/vite-plugin'

const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: 'TechShield AI',
  version: '1.0.0',
  description:
    'Enterprise AI-powered security, SEO analysis, prompt generation, and productivity tools for every webpage.',
  icons: {
    '16': 'icons/icon-16.png',
    '32': 'icons/icon-32.png',
    '48': 'icons/icon-48.png',
    '128': 'icons/icon-128.png',
  },
  action: {
    default_popup: 'src/popup/index.html',
    default_icon: {
      '16': 'icons/icon-16.png',
      '32': 'icons/icon-32.png',
    },
    default_title: 'TechShield AI',
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/content-script.ts'],
      run_at: 'document_idle',
      all_frames: false,
    },
  ],
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
  options_page: 'src/options/index.html',
  permissions: [
    'activeTab',
    'storage',
    'alarms',
    'sidePanel',
    'tabs',
    'scripting',
    'notifications',
  ],
  host_permissions: ['<all_urls>'],
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'",
  },
  web_accessible_resources: [
    {
      resources: ['icons/*'],
      matches: ['<all_urls>'],
    },
  ],
}

export default manifest

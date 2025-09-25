import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'LinkedIn Connections',
  version: '0.0.1',
  action: { default_popup: 'src/popup/popup.html' },
  permissions: ['storage', 'scripting', 'activeTab', 'cookies'],
  host_permissions: ['https://www.linkedin.com/*'],
  background: { service_worker: 'src/background/background.ts' },
  content_scripts: [
    {
      matches: ['https://www.linkedin.com/*'],
      js: ['src/content/content.ts'],
      run_at: 'document_idle'
    }
  ],
  web_accessible_resources: [
    {
      resources: ['assets/*'],
      matches: ['https://www.linkedin.com/*']
    }
  ],
  options_page: 'dashboard/dashboard.html',
  chrome_url_overrides: { newtab: 'dashboard/dashboard.html' }
})

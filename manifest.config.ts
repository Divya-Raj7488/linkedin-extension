import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest(() => ({
  manifest_version: 3,
  name: 'LinkedIn Connections',
  version: '0.0.1',
  action: { default_popup: 'popup/index.html' },
  permissions: ['storage', 'scripting', 'activeTab'],
  host_permissions: ['https://www.linkedin.com/*'],
  background: { service_worker: 'src/background.ts' },
  content_scripts: [
    {
      matches: ['https://www.linkedin.com/*'],
      js: ['src/content/main.ts'],
      run_at: 'document_idle'
    }
  ],
  web_accessible_resources: [
    {
      resources: ['assets/*'],
      matches: ['https://www.linkedin.com/*']
    }
  ]
}));

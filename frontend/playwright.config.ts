import { defineConfig } from '@playwright/test';

const widths = { mobile: 320, tablet: 768, desktop: 1440 } as const;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 0,
  use: { baseURL: 'http://localhost:5173', locale: 'en-US' },
  projects: Object.entries(widths).map(([name, width]) => ({
    name,
    use: { browserName: 'chromium' as const, viewport: { width, height: 900 } },
  })),
  webServer: [
    {
      command: 'npm run dev -w backend',
      cwd: '..',
      url: 'http://localhost:3000/api/health',
      reuseExistingServer: true,
      env: { UPSTREAM_FIXTURES: '1' },
    },
    {
      command: 'npm run dev -w frontend',
      cwd: '..',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
    },
  ],
});

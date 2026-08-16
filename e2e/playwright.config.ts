import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  // All specs share a single Firebase Emulator backend (one Firestore/Auth instance,
  // no per-test isolation) and each test wipes+reseeds it via the `seed`/`loggedInPage`
  // fixtures — running tests in parallel races those wipes/seeds against each other.
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  reporter: process.env['CI'] ? [['html', { open: 'never' }], ['github']] : 'html',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: 'npx ng serve --configuration=e2e',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});

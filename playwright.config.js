import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testIgnore: '**/production/**',
  outputDir: 'test-results/development',
  forbidOnly: Boolean(process.env.CI),
  timeout: 90000,
  expect: { timeout: 7000 },
  fullyParallel: false,
  // Each test owns a browser context; keep files serial internally while allowing
  // two independent suites to overlap their audio/animation observation windows.
  workers: 2,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:5173', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    // The scene geometry suite supplies its own five viewports. Run that matrix
    // once; native touch/reachability is covered by the other scene suites.
    { name: 'phone', testIgnore: ['**/production/**', '**/scene-composition.spec.js'], use: { ...devices['Pixel 7'], viewport: { width: 393, height: 851 } } },
    { name: 'phone-landscape', testIgnore: ['**/production/**', '**/scene-composition.spec.js'], use: { ...devices['Pixel 7'], viewport: { width: 780, height: 284 } } },
  ],
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI },
});

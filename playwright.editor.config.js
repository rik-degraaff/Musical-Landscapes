import { defineConfig } from '@playwright/test';
import base from './playwright.config.js';

export default defineConfig({
  ...base,
  testMatch: '**/visual-editor.spec.js',
  outputDir: 'test-results/visual-editor',
  projects: base.projects.filter(project => ['desktop','phone-landscape'].includes(project.name)),
  use: { ...base.use, baseURL: 'http://127.0.0.1:5175' },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5175 --strictPort', url: 'http://127.0.0.1:5175', reuseExistingServer: !process.env.CI },
});
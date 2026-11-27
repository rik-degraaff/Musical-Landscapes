import {defineConfig,devices} from '@playwright/test';

const url='http://127.0.0.1:5176';
export default defineConfig({
  testDir:'./e2e/pwa',outputDir:'test-results/pwa',workers:1,reporter:'list',
  use:{...devices['Pixel 7'],viewport:{width:780,height:284},baseURL:url,trace:'retain-on-failure',screenshot:'only-on-failure'},
  webServer:{command:'npm run dev -- --host 127.0.0.1 --port 5176 --strictPort',url,env:{
    VITE_SUPABASE_URL:'https://auth-fixture.farmjam.invalid',VITE_SUPABASE_PUBLISHABLE_KEY:'fixture-publishable-key',
    VITE_FARMJAM_EDITIONS:'true',
  }},
});

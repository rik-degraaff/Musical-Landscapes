import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const artwork = await readFile(resolve('public/icon.svg'), 'base64');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  for (const [size, filename] of [[192, 'icon-192.png'], [512, 'icon-512.png'], [180, 'apple-touch-icon.png']]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>html,body{margin:0;width:100%;height:100%}img{display:block;width:100%;height:100%}</style><img src="data:image/svg+xml;base64,${artwork}">`);
    await page.locator('img').evaluate(image => image.decode());
    const icon = await page.screenshot({ fullPage: true });
    await writeFile(resolve('public', filename), icon);
  }
} finally {
  await browser.close();
}
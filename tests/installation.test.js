import test from 'node:test';
import assert from 'node:assert/strict';
import {detectInstallationPlatform,installationGuide,isInstalled} from '../src/utils/installation.js';

const cases=[
  ['ios','safari','Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Version/18.0 Mobile/15E148 Safari/604.1',/Share/,/Home Screen/],
  ['ios','chrome','Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) CriOS/130.0 Mobile/15E148 Safari/604.1',/Safari first/,/Home Screen/],
  ['android','chrome','Mozilla/5.0 (Linux; Android 14) Chrome/130.0 Mobile Safari/537.36',/three-dot/,/Install app/],
  ['windows','edge','Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36 Edg/130.0',/Edge/,/Pin to taskbar/],
  ['windows','chrome','Mozilla/5.0 (Windows NT 10.0) Chrome/130.0 Safari/537.36',/Install page as app/,/Pin to Start/],
  ['macos','safari','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Version/17.0 Safari/605.1.15',/Sonoma 14/,/Add to Dock/],
  ['macos','safari','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Version/16.0 Safari/605.1.15',/Otherwise/,/Chrome/],
  ['macos','chrome','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/130.0 Safari/537.36',/Chrome/,/Keep in Dock/],
  ['linux','chrome','Mozilla/5.0 (X11; Linux x86_64) Chrome/130.0 Safari/537.36',/Install page as app/,/Add to Favorites/],
  ['linux','other','Mozilla/5.0 (X11; Linux x86_64) Firefox/130.0',/Chrome/,/desktop environment/],
  ['unknown','other','',/could not identify/,/bookmark/]
];
for(const [os,browser,userAgent,first,copy] of cases)test(`installation route: ${os} ${browser} ${userAgent.includes('Version/16')?'older Safari':''}`,()=>{
  assert.equal(detectInstallationPlatform({userAgent}).os,os);
  assert.equal(detectInstallationPlatform({userAgent}).browser,browser);
  const guide=installationGuide({userAgent});
  assert.match(guide.steps[0],first);
  assert.match(guide.steps.join(' '),copy);
});

test('desktop-mode iPad is not mistaken for macOS',()=>{
  const device={userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Version/18.0 Safari/605.1.15',platform:'MacIntel',maxTouchPoints:5};
  assert.equal(detectInstallationPlatform(device).os,'ios');
});

test('other Android browsers use the Chrome fallback',()=>{
  assert.match(installationGuide({userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/130.0 SamsungBrowser/26.0 Safari/537.36'}).steps[0],/Chrome first/);
});

test('Opera uses an alternative-browser route rather than Safari instructions',()=>{
  const device={userAgent:'Mozilla/5.0 (Windows NT 10.0) Chrome/130.0 Safari/537.36 OPR/115.0'};
  assert.equal(detectInstallationPlatform(device).browser,'other');
  assert.match(installationGuide(device).steps[0],/Open this same website in Edge or Chrome/);
});

test('installed detection covers browser display mode and iOS standalone',()=>{
  assert.equal(isInstalled({standalone:true}),true);
  assert.equal(isInstalled({displayMode:true}),true);
  assert.equal(isInstalled(),false);
});
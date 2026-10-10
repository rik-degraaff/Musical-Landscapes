import test from 'node:test';
import assert from 'node:assert/strict';
import {detectInstallationPlatform,installationGuide,isInstalled} from '../src/utils/installation.js';

const cases=[
  ['ios','safari','Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Version/18.0 Mobile/15E148 Safari/604.1',/Share/,/Home Screen/],
  ['ios','chrome','Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) CriOS/130.0 Mobile/15E148 Safari/604.1',/Safari first/,/Home Screen/],
  ['android','chrome','Mozilla/5.0 (Linux; Android 14) Chrome/130.0 Mobile Safari/537.36',/three-dot/,/Install app/],
  ['windows','edge','Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36 Edg/130.0',/Edge/,/Windows Start/],
  ['windows','chrome','Mozilla/5.0 (Windows NT 10.0) Chrome/130.0 Safari/537.36',/Install page as app/,/app list/],
  ['macos','safari','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Version/17.0 Safari/605.1.15',/Sonoma 14/,/Add to Dock/],
  ['macos','safari','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Version/16.0 Safari/605.1.15',/Otherwise/,/Chrome/],
  ['macos','chrome','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/130.0 Safari/537.36',/Chrome/,/Applications/],
  ['linux','chrome','Mozilla/5.0 (X11; Linux x86_64) Chrome/130.0 Safari/537.36',/Install page as app/,/app launcher/],
  ['linux','other','Mozilla/5.0 (X11; Linux x86_64) Firefox/130.0',/Chrome/,/desktop environment/],
  ['unknown','other','',/could not identify/,/bookmark/]
];
for(const [os,browser,userAgent,first,copy] of cases)test(`installation route: ${os} ${browser} ${userAgent.includes('Version/16')?'older Safari':''}`,()=>{
  assert.equal(detectInstallationPlatform({userAgent}).os,os);
  assert.equal(detectInstallationPlatform({userAgent}).browser,browser);
  const guide=installationGuide({userAgent});
  assert.match(guide.steps[0],first);
  assert.match(guide.steps.join(' '),copy);
  assert.doesNotMatch(guide.steps.join(' '),/Pin to|Keep in Dock|Add to Favorites|pin option/i);
  assert.match(guide.installUrl,/^https:\/\/(support\.(apple|google)\.com|learn\.microsoft\.com)\//);
  for(const url of [guide.installSearchUrl,guide.restriction.searchUrl]){
    const parsed=new URL(url);
    assert.equal(parsed.hostname,'www.google.com');
    assert.ok(parsed.searchParams.get('q').includes(guide.label));
  }
  assert.ok(guide.restriction.title);
  assert.ok(guide.restriction.steps.length>=2);
});

test('mobile restriction guidance includes parent-only authentication and start/end controls',()=>{
  const ios=installationGuide({userAgent:cases[0][2]}).restriction;
  assert.equal(ios.url,'https://support.apple.com/en-us/111795');
  const apple=ios.steps.join(' ');
  for(const pattern of [/Settings > Accessibility > Guided Access/,/parent-only passcode privately/,/Face ID or Touch ID/,/installed FarmJam/,/Triple-press/,/top button/,/Home button/,/Start/,/authenticate privately/,/End/,/18 or earlier/])assert.match(apple,pattern);
  const android=installationGuide({userAgent:cases[2][2]}).restriction;
  assert.equal(android.url,'https://support.google.com/android/answer/9455138');
  for(const pattern of [/Security & privacy > More security settings/,/Search Settings/,/require your PIN/,/private from your child/,/Overview/,/app icon/,/then Pin/,/Back and Home/,/Back and Overview/,/Unlock privately/,/browser does not restrict/])assert.match(android.steps.join(' '),pattern);
});

test('desktop restrictions do not promise a generic installed-app lock',()=>{
  const windows=installationGuide({userAgent:cases[3][2]}).restriction;
  assert.match(windows.url,/windows\/configuration\/assigned-access/);
  for(const pattern of [/versions and editions/,/not Home/,/Microsoft Edge/,/not an arbitrary Chrome/,/administrator/,/Fullscreen and taskbar shortcuts do not prevent/])assert.match(windows.steps.join(' '),pattern);
  const mac=installationGuide({userAgent:cases[5][2]}).restriction;
  assert.match(mac.steps.join(' '),/does not have iPhone\/iPad Guided Access/);
  for(const index of [5,8,10]){
    const restriction=installationGuide({userAgent:cases[index][2]}).restriction;
    assert.match(restriction.steps.join(' '),/test/i);
    assert.match(new URL(restriction.searchUrl).searchParams.get('q'),/app kiosk child restricted account/);
  }
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
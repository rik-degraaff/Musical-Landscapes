# Release validation

## Persistence and playback ownership — 2026-10-18

Family/profile persistence now lives in `useFamily`, with one coherent family/settings snapshot; shared caregiver familiarity lives in `useCaregiver`. Recovery merges unchanged fields from readable storage while preserving local edits, including individual instrument options. Retry failures in one record no longer prevent independent records from saving. A landscape scheduler guard also prevents practice transport rewinds from advancing landscape composition history or scheduling its tone automation.

Current local checks ran on Windows, Node 24.14.0, npm 11.9.0 and Playwright 1.63.0 Chromium; CI targets Node 22. The full Node suite passed **349 tests**. The focused persistence browser batch passed **54 checks** on desktop and compact touch, including staggered family/caregiver recovery; the focused playback/practice batch passed **36 checks** after reproducing and fixing the practice scheduler failure. The final production build and real-worker offline/update gate passed **14 checks**. These batches overlap; do not add their counts into a unique total. Browser checks do not establish real Safari/iPad behavior, hardware audio quality or latency, hosting behavior, multi-tab coordination, or compatibility between different releases.

The broader development suite covered all **696 configured cases** in split runs: desktop recorded 226 passes, one intentional skip and five failures; the two mobile projects recorded 453 passes, eight intentional skips and three failures. All eight failed cases subsequently passed focused retries after correcting stale articulation assertions and test setup/geometry timing; one desktop retry recovered a Chromium module-load resource error. The guide resize correction also passed nine focused executions. This gives a passing execution for each of the 687 applicable cases, with nine intentional skips, **not a clean single-run gate**. The compact drop-layout check still failed intermittently in the correction batch before passing its final focused retry, so its timing stability remains a known validation limitation. No additional broad run was performed.

Evidence is retained in ignored `test-results/node-validation.log`, `test-results/persistence-browser.log`, `test-results/audio-browser-validation.log`, `test-results/production-validation.log` and `test-results/production/results.json`. Split development evidence is in `test-results/full-browser-validation.log` and `test-results/mobile-validation.log`; correction evidence is in `test-results/guide-resize-validation.log`, `test-results/compact-corrections.log`, `test-results/compact-drop-correction.log` and `test-results/desktop-corrections.log`. The original reproducible audio failure is retained under `test-results/audio-investigation/`.

## Historical setup/help evidence — 2026-10-16

The setup/help/learning implementation passed the focused checks below on Windows, Node 24.14.0, npm 11.9.0 and Playwright 1.63.0 Chromium. These are historical affected-area results, not verification of the current revision or a CI result. The unrelated working-tree cloud/artwork edits were present during validation and were not included in these implementation commits. No real Safari/iPad validation or device-performance measurements are recorded here.

| Check | Result |
| --- | --- |
| Full Node suite | 327 passed |
| Affected desktop and compact-touch suites | 121 passed, 1 intentional desktop native-touch skip |
| Final setup/learning regressions after integration review | 48 passed |
| Focused avatar-editor compatibility | 4 passed |
| Production offline and real-worker update gate | 14 passed; includes main-menu Settings and guide readers |
| Final instrument-specific visual/reduced-motion correction | 2 passed; fresh production build succeeded |
| Final build guide-worker update and offline slice | 2 passed on desktop and compact touch; separate `test-results/production-final` output |
| Project skill validation | All three skills valid |

The affected batch covers `avatar-options`, `caregiver`, `children`, `learning`, `parent-guide`, `settings`, `storage-failures` and `update-accessibility`. The final 48-check batch repeats `learning` and `parent-guide` after review fixes: app-lifetime install offers, focus restoration, metronome/portrait timing and guide revision preservation. The full production run tested `index-BAPLigtz.js`; the final pan-flute/string illustration correction produced `index-Bh9mRbiM.js` and was checked separately. Do not add these overlapping execution counts to claim a unique test total.

The final build reports JavaScript **846.88 kB (246.19 kB gzip)**, CSS **119.62 kB (25.56 kB gzip)** and **204 precache entries / 17,687.49 KiB**. Vite's large-chunk warning remains. These are build sizes, not runtime memory or speaker latency. Production evidence from the 14-check gate is retained under ignored `test-results/production/results.json`; guide previews are `test-results/learning-desktop-guide.png` and `test-results/learning-phone-landscape-guide.png`.

## Gate commands

Use Node 22 and the committed lockfile:

```sh
npm ci
npm test
npx playwright install chromium
npm run test:e2e:release
npm run test:production
```

`npm run test:e2e:release` covers desktop and compact landscape touch emulation. `npm run test:production` performs a fresh build followed by real Chromium service-worker checks for offline assets and deferred updates. `npm run test:e2e` additionally includes portrait emulation. Linux CI can install browser dependencies with `npx playwright install --with-deps chromium`.

Investigate failures before rerunning. Production checks require a free preview port and use `test-results/production`; do not run another Playwright process against that output concurrently. See [contributing](contributing.md) for focused test selection.

## Historical automated evidence

The following are dated records, not claims about the current revision:

- **2026-10-12, application commit `cb4a58f`:** Windows, Node 24.18.0, Playwright 1.63.0, Chromium. The recorded run passed 148 Node tests and 10/10 production checks; the recorded full development gate passed 313 checks, skipped one desktop-only native-touch case, and had zero failures. These commits predate later feature and documentation work.
- **2026-10-12 follow-up, application state associated with release infrastructure commit `f518cc3`:** the recorded final full development gate passed 313 checks, skipped one inapplicable desktop native-touch check, and had zero failures. Production checks passed 10/10 and all 192 recordings were decoded. This is historical and not a verification of the current tree.
- **Later follow-up documented in the prior release record:** focused checks reported 315 unit tests, 10 production checks, and several focused browser batches passing. The same record explicitly says the full development gate was not rerun after final repairs and that scene-layout failures remained outside that follow-up. Treat these as focused results only.

The old detailed output and limitations were consolidated here to avoid presenting repeated intermediate runs as current status. See repository history for original logs if exact traces or per-suite details are needed.

## Limits that remain unverified

Chromium automation does not establish real Safari/iPad behavior, hardware multi-touch, VoiceOver or switch compatibility, speaker latency, memory pressure, offline retention after OS eviction, multi-tab update coordination, hosting cache headers, or forward/rollback compatibility between different releases. No device performance baseline is recorded. Verify these on the actual supported devices and hosting setup before making those claims.

## Manual device and deployment checks

Record release SHA, tester/date, device model, OS/browser version and browser versus installed-app mode with each result.

- On a real iPad, create and cancel profiles, use short-screen setup and help, try large text, VoiceOver and reduced motion, then verify names and independent settings after reopening.
- Hold multiple real touches on instrument controls, release outside the surface, rotate, background, lock and resume. Listen for stuck notes, missing wake gestures and doubled rhythm.
- Finish installation online, then fully close/reopen and reload offline. Try all selected instruments, change landscapes and visit practice. Interrupt a fresh installation, reconnect and verify recovery; seeing the menu alone does not prove complete audio caching.
- Stage a real previous-release upgrade during play and caregiver drafts. Verify that reload waits for a safe menu. Repeat with two open tabs and browser/installed-app clients; the automated byte-marked worker tests use coherent same-build assets.
- Retain the previous complete build and hashed assets. Rehearse hosting rollback and old/new storage compatibility. Preserve family records and originals; clearing site data or unregistering workers is not a routine fix.
- Measure first/warm startup, cache completion, repeated-session memory/frame behavior and input-to-speaker latency on target hardware. Use repeated trials and keep raw measurements; build bytes and test duration are not device-performance measurements.

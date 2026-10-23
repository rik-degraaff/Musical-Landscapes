# Release validation

## Shared illustration and responsive composition review — 2026-10-23

The current visual direction is maintained in [visual standards](visual-standards.md), with agent and visual-editing skill entry points. A shared material palette now connects the child, eight instruments, all 28 scene objects/visitors, practice illustrations, metronome, sky and app icons. Avatar colors remain user-selected. Habitat props belong to the landscape: the woodpecker grips an existing tree, perching birds meet named branches, and bees/swimmers share the scene's flower/water anchors. The airplane uses consistent near/far wing and tail ordering.

Composition uses the measured landscape world, including its reduced height above an open instrument panel. A single catalog owns object size tiers and contacts, tree positions, and house doorway/path transforms. All five house-bearing scenes derive the road from the doorway's actual bottom edge and width. Middle-distance buildings and structures remain smaller and quieter than foreground playable content. Accepted layout overrides were promoted into this baseline; the override file is empty.

Rendered review covered all 25 top/bottom combinations plus 24 age/hair/skin variants, enlarged and compact instrument/practice artwork, and all 28 objects at rest and through reaction poses. Full-scene captures covered seven screen shapes × seven scenes × three visitor variants × panel open/closed (294 images). That pass exposed 12 short-panel reachability defects caused by the old metronome offset. After correction, a targeted 63-image panel pass at compact, minimum and very wide sizes found no world-bound or reachability issues and no page errors. These are split inspections, not a single clean 294-image pass. The automated nine-size matrix additionally covers house/path joins, 44px scene targets, pair separation and access with the panel open.

The broader development run exposed a compact cloud center hidden behind the sun's touch target. Weather anchors now reserve the largest genre silhouette and shift sideways around the scene's settled sun/moon position; instruments settle around those reserved areas. Lowering clouds was rejected during follow-up checks because terrain and foreground animals hid them in short worlds. Clouds retain a consistent sky row and scale to both world dimensions. Corner metronomes and expanded menus respect device safe-area insets, and Escape dismisses the practice metronome before the practice room. A guide keyboard test now waits for the page's intended deferred heading focus before moving focus manually, retaining the actual Tab-order assertion. The editor's restoration test captures the authored starting fill instead of assuming the old barn color.

Final review captured another **126 scenes** across compact, minimum and very wide screens, all visitor tiers and both panel states, after the sky corrections. All six contact sheets were inspected; the capture reported no world-bound/reachability defects and no page errors. Airborne visitor anchors were separated from the resident bat and clouds. Pure geometry coverage now checks all regular/visitor pairs and sky reservations across all 18 full/panel worlds from the nine browser viewports.

Current checks ran on Windows, Node 24.14.0, npm 11.9.0 and Playwright 1.63.0 Chromium. CI targets Node 22.

| Check | Result |
| --- | --- |
| Final full Node suite | 350 passed, no skips |
| Unique development/editor cases across three projects | 669 passed, 9 intentional skips, no unresolved failures |
| Final nine-size scene matrix | 27 passed |
| Corrected cloud, safe-area and visitor regressions | 9 passed across the three projects |
| Corrected Linux guide focus regression | Passed on desktop |
| Fresh production build and real-worker/offline gate | Build succeeded; 14 passed |

Development coverage is a **split run with targeted corrections, not a clean single-run gate**. The 678-case manifest was reconciled by project, file and full title, mapping the renamed safe-area case. Earlier focused/editor and remaining batches were followed by affected-area checks and corrections; their overlapping counts must not be added to the unique total. One affected visitor execution reported a recovered React concurrent-render error without its original cause in the retained trace. Added cause-chain diagnostics preserved the error assertion, and all three targeted visitor executions subsequently passed without that error. A sandboxed Node launch could not connect to its local test server; the successful final run used the required loopback permission.

Evidence is retained under ignored `test-results/style-review/`: `validation/node-final.log`, `validation/reconciled.json`, the per-batch JSON/logs/traces in `focused`, `retry`, `remaining`, `final-main`, `final-targeted`, `final-matrix`, `final-matrix2` and `final-matrix3`, and `validation/final-production/runner.log`. Rendered galleries are in `playable/`, `scenery/`, `scenes/` and `final-scenes/`. The final build uses `index-BvYPeVzM.js` and `index-SC2u8Y5U.css`, with 204 precache entries and the existing large-chunk warning. These checks establish Chromium emulation and production-worker behavior; they do not establish real-device appearance, hardware input or audio latency.

## Historical test audit and compact placement correction — 2026-10-23

Reviewed the Node, development/editor browser and production suites. The Node suite now has **345 cases**, with duplicate catalog/range/fingering assertions consolidated into their owning suites. Ownership fixtures retain two seconds of audio at a small mock sample rate; real-rate envelope and browser output checks remain. The development matrix now has **663 configured cases**: the five-size scene matrix runs once rather than once per input project, and startup retry coverage replaces a duplicate development recording decode. The scene matrix also stops writing 1,260 unasserted success screenshots and waits for instrument transitions instead of fixed sleeps. A representative scene case took 15.7 seconds before these changes and 5.1 seconds afterwards locally; this is an observed case timing, not a full-suite benchmark. Development files use two isolated workers; production remains serial.

The broad run exposed two failures. Flute autoplay can leave the high register selected, where the test's single pinky key has no valid fingering; the test now selects a playable register before asserting its manual voice. The compact drag failure was a real layout bug: implicit grid tracks displaced piano artwork 16.027 pixels horizontally and 8.395 pixels vertically from its hitbox center, while collision placement assumed those centers matched. Explicit bounded grid tracks center oversized artwork without changing its dimensions, and the drag regression now asserts that shared center.

Current checks ran on Windows, Node **24.14.0**, npm **11.9.0**, Playwright **1.63.0**, Chromium. CI targets Node 22.

| Check | Result |
| --- | --- |
| Full Node suite | 345 passed; the 8 settings cases also passed after preserving the explicit six-slot length assertion |
| Development/editor browser coverage, all three projects | Every one of the 654 applicable cases has a passing execution; 9 intentional skips |
| Initial focused desktop scene/startup batch | 17 passed |
| Remaining development cases, two workers | 635 passed, 2 failed, 9 skipped in 29.9 minutes |
| Both failed cases after correction | 2 passed in 32.3 seconds |
| Affected placement, native gestures and editor placement after the CSS correction | 41 passed, 2 existing native-editor skips in 2.5 minutes |
| Final production build and full real-worker/offline gate | Build succeeded; 14 passed in 1.7 minutes |

Development evidence is a **split run with targeted corrections, not a clean single-run gate**. The final manifest was reconciled against the result files by project, file and full test title: 663 configured, 654 passed, 9 skipped, no unresolved cases. The affected placement batch overlaps earlier executions; do not add its counts to the unique total. One sandboxed correction launch stalled before tests started, was stopped, and supplied no validation result; the successful correction and final batches used the required browser/loopback permissions. Long checks now use cheaper-agent completion reports, with startup confirmation before waiting for process exit.

Production now decodes the full recording bank only in its dedicated offline case on each project, retaining duration and RMS checks. Every offline/update/retry case still fetches every recording from the real worker and compares its SHA-256 with the local asset, then exercises offline play, keyboard input and menu/restart behavior. Listener/CDP cleanup is explicit. The final build retains the existing large-JavaScript-chunk warning and has 204 precache entries. These automated checks do not establish Safari/iPad behavior, real-device performance or audio latency, hosting behavior, multi-tab updates, or compatibility between different releases.

Evidence is retained under ignored `test-results/test-audit-*`: `node-final.log`, `settings-final.log`, `layout-after.json`, `development-results.json`, `failed-final-results.json`, `placement-final-results.json`, `coverage.json`, `build-final.log`, and `production-current-results.json` (each with the `test-audit-` prefix). Original browser failure traces remain under `test-results/test-audit-development/`; the reproduced compact geometry is under `test-results/placement-investigation/`.

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

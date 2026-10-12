# Release Validation

## Automated Gates

Use Node 22 and the committed lockfile. From the repository root:

```sh
npm ci
npm test
npx playwright install --with-deps chromium
npm run test:e2e:smoke
npm run test:production
```

On Windows, `npx playwright install chromium` installs the browser without the Linux dependency step. The focused development smoke runs lifecycle, practice, string voicing, children and settings on desktop Chromium and compact landscape touch emulation. `npm run test:e2e:release` runs the full development suites on those two viewports; `npm run test:e2e` additionally includes portrait phone emulation. Development tests may use source instrumentation in their existing fixtures; production tests do not import, fetch or rewrite application source.

CI uses Node 22, `npm ci`, Node unit tests, installed Chromium and the full two-viewport development suite (including the focused smoke suites). It builds once with `npm run build`, then runs `npm run test:production:built`. The latter requires an existing fresh build; prefer `npm run test:production` locally, which builds before testing. Do not put a second build in the production web-server command.

Production has an independent config, test directory and output directory. It starts a fresh preview on `http://127.0.0.1:4173` with `--strictPort` and `reuseExistingServer: false`; an occupied port is an error, not permission to use another build. Development runs on port 5173 and excludes production tests. Stop any unrelated preview on 4173 before running. The existing development server on 5174 is not used by these checks. Production remains single-worker on both viewports.

Each production test gets a fresh browser context and a normalized basic saved profile, seeded through `page.evaluate` using public local-storage formats. First installation must activate; if it has not claimed the page, a subsequent navigation acquires control. The test then requires an activated controlling worker and HTML plus every bundled audio file in the Workbox precache. It disables Chromium's HTTP cache, goes offline, checks that reload and audio responses actually come from the worker, and fetches/decodes every public MP3/WAV/FLAC recording (including unselected instruments and scenery source recordings). Positive duration, channels and nonzero signal are required. Offline Play must initialize, keyboard press/release must update the piano surface, Settings must open, and returning to the child menu must permit another Play session. This is a UI/decode check, not a measurement of audible output or latency.

The interrupted-install check gates one Chromium worker-owned precache request and returns HTTP 503. It observes the installing worker becoming redundant and verifies that no controller or successful cache entry for that recording exists. After removing the intercept, a normal online reload must retry registration, complete the cache, and pass the same offline checks. It does not fake failure with page audio routing, unregister workers to force recovery, or substitute a worker implementation. An inability to intercept the worker is a failing Chromium gate, not evidence of recovery. Other browser engines are not covered by that routing technique.

Two genuine update checks independently cover active Play and an unsaved ParentGuide on the menu. Chromium does not expose the top-level `sw.js` update fetch to Playwright routing. Instead, `context.route` intercepts the built worker's worker-owned `workbox-*.js` import during initial installation and appends a deterministic comment marker to its real network response. The complete generated worker behavior, precache manifest, asset revisions and application bytes remain unchanged. A subsequent real `navigator.serviceWorker` registration's `update()` sees the unmodified preview script as a byte-different successor and installs it. The route must have observed a worker-owned request and changed its SHA-256; a missing intercept or waiting worker fails the gate. No app events, update-policy methods or worker implementation are mocked.

While unsafe, the successor must be genuinely `installed` and `registration.waiting`, with the original active worker and identical controller object. Keyboard note press/release must work during Play; guide name and age edits must survive Next/Previous navigation without being saved. Profile/settings bytes and all precache request URLs, including revisions, must stay identical. Returning through Settings to the menu, or explicitly canceling the draft guide, must send exactly one real `SKIP_WAITING`, produce exactly one controller change and one document reload, and leave an activated worker with no waiting successor. The native `ServiceWorker.postMessage` is observed and forwarded unchanged; session-storage counters observe boots and native events without triggering them. The selected saved profile must survive. The updated worker must then pass the full offline cache/decode/play check plus repeated Play/menu cycles, with no additional update message, controller change or unintended reload. Canceling intentionally discards the guide draft; automatic draft recovery after closing is not promised.

This proves the built app's wired `useAppUpdates` contract with a real installed successor, not compatibility between different application releases. Only imported worker bytes differ; no old/new asset versions are mixed. It does not validate two-tab coordination, a deploy host's cache headers, actual release-to-release migration or rollback. The mocked unit policy checks are supporting tests, not a substitute for this gate.

A third genuine-worker case covers activation reentry. The test temporarily holds one native `SKIP_WAITING` delivery after a safe menu is reached, reopens caregiver setup with a new draft, and forwards that exact message unchanged. The successor activates and replaces the real controller, but the new draft must survive without reload. Canceling setup then causes one reload with no second activation message. Controller identity, draft contents, family bytes and coherent cache revisions are asserted, followed by actual offline recording decoding and repeated Play/menu sessions. Holding native delivery makes the otherwise brief activation race reproducible; no app update-policy event or method is mocked.

Readiness uses browser lifecycle events and bounded assertion polling, with no sleeps or relaxed pass-on-timeout behavior. Production runs with one worker, no preview reuse and no automatic retries. Both configs forbid `test.only` in CI. Every production test attaches browser console errors and page errors plus offline decode results; update checks also attach script hashes and lifecycle/storage/cache snapshots. The production JSON reporter persists successful and failed results in `test-results/production/results.json`, with inline attachment bodies encoded as base64; the list reporter alone would not preserve successful attachments. The intentional first-install error is retained in diagnostics; page errors are never permitted, and unexpected console errors after retry fail. The exact offline `ERR_INTERNET_DISCONNECTED` for the external Google Nunito stylesheet is retained but allowed: bundled UI and recordings work with fallback typography, but this font is not available offline. Other resource errors are not allowed by that exception. Failed tests retain traces and screenshots. CI uploads the `release-validation-evidence` artifact on success or failure for 14 days; download the artifact and use `npx playwright show-trace <trace.zip>` for failures. Review all failures before release; do not rerun until green without investigating.

For an isolated focused check against an existing fresh build, run `npm run test:production:built -- --grep "genuine production worker update"`. Follow it with the full `npm run test:production:built` gate. Production artifacts remain under `test-results/production`; do not run another runner against that output directory concurrently.

Local result on 2026-10-12: the final integrated production gate passed **10/10 checks in 1.9 minutes**, with all **192 recordings** decoded per offline check. This was Windows / Node 24.18.0 / Playwright 1.63.0 Chromium, using application commit `cb4a58f`. The elapsed suite time is tooling evidence, not device performance. The Node 22 Ubuntu CI job has not been executed by this local run. All **148 Node unit tests** passed against the same application code.

The final full development release gate completed with **313 passed, 1 intentional skip and 0 failures in 29.3 minutes** across desktop and compact landscape touch Chromium. The skipped native-touch pinch case is inapplicable to the non-touch desktop project; its compact-touch counterpart passed. This 314-check run used the same frozen application code as the unit and production gates above, with release infrastructure committed in `f518cc3`.

Integration checks passed: 30 storage/update unit tests; four startup browser regressions; 24 existing family/settings compatibility checks; 29 storage/update/accessibility browser checks, with the desktop native-touch pinch case intentionally skipped. Transient-read recovery during active playback preserves accompaniment and known unsaved settings while recovering saved sibling profiles. A first full development release run passed 304 checks, skipped that touch-only case and exposed one forced-click race with a moving celestial control in the existing visitor test. Its trace showed the click landing at the control's old position. The test now waits for a settled control and asserts every scene transition, without sleeps or relaxing expectations; four focused repetitions across desktop/compact touch passed. Two subsequent broad attempts were interrupted, not passed; the final complete result is recorded above. CI has a 60-minute budget because the full browser gate takes approximately 30 minutes before build/production checks and browser installation.

## Scene-Transition And CI Follow-Up

The subsequent scene-transition fix keeps every remaining event in the current bar's captured key and starts the latest requested key at the next downbeat. It never performs an early-bar restart. Already queued next-bar sources are owned and replaced without canceling the current bar; per-bar identities also invalidate obsolete visual cues, including rapid A/E/A changes. The audible key is published after, not before, the downbeat; equipped controls and held manual input survive the visual scene change until that boundary. Ringing manual drum sources also defer key changes. The shared transport is not restarted.

The reported GitHub guitar assertion sampled audio only after the short strum and several browser round trips. Capture now begins before the gesture and retains its observed peak; the original `0.001` threshold and exact played-note assertions remain. Practice entry waits for a reachable native pointer target while startup layout settles, uses touch gestures on the touch project, and includes the equipped-instrument target accepted by the real handler. It does not force-click an obstructed character or call the practice action directly. The long-sustain test waits for the committed new key before starting its sustained note. Chord-cleanup timing starts inside the actual cleanup handler rather than before the input-dispatch round trip; its original 130 ms native-source deadline remains.

Final local checks on Windows / Node 24.18.0 / Chromium:

- All **172 unit tests** passed.
- All **48 lifecycle, native-cleanup and scene-transition browser checks** passed across desktop and compact touch (4.4 minutes).
- All **38 performance checks** passed (6.1 minutes).
- The full practice suite passed **32 executions**, two repetitions on both viewports (3.9 minutes).
- All **12 string-voicing checks** passed in the practice/voicing batch; that batch's separate practice hit-target failure was investigated and fixed before the successful full practice repeats.
- All **10 fresh-build production worker checks** passed (3.4 minutes), including decoding all 192 recordings offline.

Earlier exploratory runs exposed the fixed hit-target and dispatch-timing issues; one boundary run timed out waiting for its audio clock, followed by six unchanged focused passes and the successful complete boundary batch. Interrupted broad runs are not counted as passes. These final results are completed affected-suite batches, not a new full development release run. The GitHub-hosted Linux rerun and real-device checks remain unverified locally; no retries or weaker loudness/release assertions were added to CI.

The follow-up build contains `assets/index-BKGJUAZs.js` at **760.04 kB / 219.69 kB gzip**, unchanged CSS at **110.10 kB / 23.69 kB gzip**, and **204 precache entries / 17,593.38 KiB**. Vite transformed 2,908 modules and retained the large-chunk warning. Passing only the four needed Tone APIs into the owned-source helper avoids retaining the entire namespace in the bundle. The earlier measured baseline below is preserved as historical evidence, not the current artifact.

## Composition, Hints And Mixer Follow-Up

Status: **focused checks passed; full development release gate not green**. The historical results above do not validate this follow-up. Repeat the following checks against the committed revision before release:

```sh
node --test tests/composition.test.js tests/audioEngineOwnership.test.js tests/settings.test.js tests/practiceComposition.test.js
npm run test:e2e -- e2e/composition.spec.js e2e/harmony.spec.js e2e/difficulty.spec.js e2e/practice-composition.spec.js e2e/string-voicing.spec.js e2e/startup.spec.js e2e/audio-ownership.spec.js --project=desktop --project=phone-landscape
```

- Composition unit coverage includes whole four/eight-bar progression transitions, independent role-specific motif chains, at most two active piano/guitar/ukulele accompaniment parts, melody/percussion roles, deterministic voicing, canonical strings, playable ranges, all scene roots including minor keys, and flat chord labels for D-flat/F minor. Equipped-only tiers leave unequipped parts at Advanced; shared harmony remains compatible with equipped controls.
- Ownership tests cover audible-downbeat publication, replacement of future plans without replacing the current bar, named motif pins revoiced under harmony, dormant pin preservation, Next phrase activation, scoped difficulty/equipment cancellation, stale-pitch rebuilding, and practice restoration with fixed compatible partner harmony. Practice preserves legacy exercise indices and appends playable composition motifs; browser checks complete new piano accompaniment and ukulele melody exercises through real controls.
- Composition browser coverage checks live plan/event ownership, accompaniment caps, next-harmony continuity across bars and keys, Simple piano/ukulele playability and motif pinning, plus the transient +3 dB equipped boost capped at 0 dB, preserved -60 dB mute and unchanged base/stored values through equipment switching, tempo holds, background recovery and Restore defaults.
- Harmony browser coverage checks subtle default highlights, per-instrument persistence, optional Advanced `Next:` text, Simple suppression, actual available controls without pressing them, and removal at audible-key mismatch, practice and menu boundaries. These are control highlights, not directional arrows. Some cases inject plans to isolate UI behavior; the composition suite separately checks live plans.
- Restore defaults coverage checks immediate live reset of all instrument/scenery gains without writing settings/family storage or changing difficulty/display preferences. Current sound levels are session-only: closing Settings does not save them. Instrument/display preferences save immediately, independently of the sound mix.

Local follow-up results on Windows / Chromium: all 315 final unit tests and all 10 fresh-build production worker checks passed. The focused browser batch passed 52 checks across desktop and compact touch; its four new practice text-containment checks were corrected to measure the allocated guide row rather than a tight font line box, then all four practice cases passed. A confirmation batch passed 54 checks and exposed two Simple-skip observation races: the test now waits for the equipped phrase and captures the real handler's before/after values atomically. All eight repeated skip executions passed, twice per instrument on each viewport. The revised day-cycle and equipped-autoplay performance slice passed 3/3 desktop checks. The production build retains Vite's large-chunk warning. These are affected-suite results, not a clean full-release result.

The earlier complete development release gate reported 328 passed, 5 skipped and 55 failed before obsolete music/gain expectations and test instrumentation were repaired. Scene layout failures remain outside this follow-up. An isolated `git archive` of original HEAD `be192e0eb8287e39e789f6b698b10efe299e7ccc`, served on port 5181, reproduced the phone-regular habitat failures (floating tractor/windmill and a settled celestial overlap) and the compact-touch tractor blocking the native scene-control click. No scene placement overrides were changed here. The broad gate has not been rerun after the final repairs and must not be described as passing.

These checks cover structural and playback contracts, not perceived musical quality, speaker latency or real-device performance. Follow focused checks with the full development and fresh-build production gates; do not infer a CI pass from local focused checks or historical results.

## Real Safari And iPad Checklist

Status: **not verified on real devices by these automated checks**. Chromium touch emulation is not Safari, hardware multi-touch, actual speakers, or iPad memory pressure. Record tester, date, release SHA, device model, OS/Safari version, browser versus Home Screen mode and result for every item.

- On a clean real iPad, open the HTTPS release in Safari, complete all 11 child-setup steps, and confirm that canceled setup leaves no draft profile behind.
- Install to the Home Screen. Wait for the app's actual offline-ready state if exposed; otherwise test readiness by airplane-mode reload. Do not equate seeing the menu with a complete audio cache.
- In airplane mode, fully close/reopen and reload in Safari and Home Screen mode. Enter Play, switch available instruments and landscapes, play manual notes and chords, open practice, and return through Settings to the child menu. Listen for missing samples and stuck notes.
- Test portrait rotation guidance, compact landscape, safe areas, browser bars, software keyboard, large text, VoiceOver, reduced motion and touch targets. Check keyboard-only play with an attached keyboard where available.
- Hold notes/valves/strings with multiple real fingers, then release outside the surface. Background, lock, take an interruption, and resume; verify no stuck sounds, doubled rhythms, or lost first wake gesture.
- Interrupt a genuinely fresh install's connection, reconnect, reopen and then try offline again. Separately stage an old-release-to-new-release update during Play and while a guide draft is open. Confirm no activation, reload or lost edit until returning to a safe menu with the guide closed, then one activation/reload and coherent offline play. Repeat with two open tabs and browser versus Home Screen clients; automated single-page Chromium coverage does not prove those cases.
- Keep two child profiles with different settings; verify selection and settings after restart, offline use and update. Test low available storage and cache eviction honestly: offline cannot be promised after the OS deletes storage.

## Performance Protocol

Status: **no real-device performance measurements recorded here**. Do not report CI duration or emulation as hardware performance evidence.

### Measured Build Baseline

Measured on 2026-10-12 at application commit `cb4a58f` on Windows using Node 24.18.0, `npm run build`, Vite 8.3.2 and vite-plugin-pwa 2.0.0. These are build-reporter sizes, not network transfer, resident memory or a deployed release SHA. CI targets Node 22, so retain that environment's output separately rather than assuming byte-identical artifacts. The production checks use this same generated local build, not the development server.

| Artifact | Measured size | Gzip reported by Vite |
| --- | ---: | ---: |
| `assets/index-TLyEeh43.js` | 756.69 kB | 218.64 kB |
| `assets/index-CeRpNrDz.css` | 110.10 kB | 23.69 kB |
| `index.html` | 0.80 kB | 0.44 kB |
| Workbox precache | 204 entries / 17,590.12 KiB | Not reported |

Vite reported 2,907 transformed modules and a 967-millisecond build, with its warning for a minified chunk over 500 kB. Build time is one local tooling observation, not a runtime budget. The historical approximately **751 kB JavaScript bundle** is retained as prior context only: its exact artifact, gzip size and reproducible build conditions are not attached here, so do not claim a measured runtime improvement or regression from that rounded figure. The current 756.69 kB result is the reproducible baseline to carry into feature experiments, not permission to ignore the warning.

Still unmeasured: real Safari/iPad first/warm start, complete-cache elapsed time, decoded-audio memory, peak and post-session resident memory, sustained frame time and input-to-speaker latency. Offline decoding confirms readable non-silent buffers, not low latency or bounded memory under pressure. No Safari/device numbers or pass status are inferred from Chromium emulation. Store raw release/device trials alongside this build table before accepting hardware performance claims.

Use the same release SHA and a known previous-good release on the same target desktop and real iPad. Record hardware, OS/browser, power mode, thermal state, sample rate, speaker/headphone path, network conditions and available storage. Separate clean first load/install, warm online start and warm offline start. Run at least five trials of each; preserve raw measurements and report median and worst observed values, not a single favorable run.

Measure navigation-to-interactive menu, user Play-to-ready landscape, complete offline cache readiness, transferred bytes and cache size using browser performance/network records. Measure frame times and long tasks while all six selected instruments play, changing landscapes, opening practice and rapidly releasing held input. Measure input-to-audible latency with external audio/video recording on the actual device; browser callback timestamps alone do not measure speaker latency. Use Safari Web Inspector for allocations and dropped frames where supported, note unavailable metrics, and check memory across repeated Play/menu/background cycles.

Set release budgets from a recorded previous-good baseline and the intended supported devices before comparing candidates. Investigate regressions and audio glitches even when averages look acceptable. Do not invent numeric budgets or mark this checklist passed without attached evidence.

## Rollback And Compatibility

Before deployment, retain the complete previous-good immutable build, its worker and hashed assets, release SHA, lockfile and hosting/cache headers. Verify the actual hosting platform can restore that build atomically. Stage both an update and a rollback with an already-installed profile and worker; the same-assets byte-marked update gate above does not prove cross-release compatibility or a host rollback.

If release checks or real-device use fail, stop promotion and restore the previous-good build through the hosting system. Preserve old hashed assets while installed old workers/clients may still request them. Rollback of server files does not immediately replace an active worker or an offline client's caches; reconnect and follow the existing app update policy at a safe session boundary. Verify the served HTML, worker and assets are the intended release, then test old installed clients online and offline again. Never promise an immediate remote rollback for an offline device.

Keep `farmjam-children-v1` and `farmjam-settings-v1` readable by the rolled-back release. Future migrations must be backward compatible or retain versioned original data and an explicit restore plan; do not let an old build overwrite the only copy of newer child data. Rehearse selection, avatars and independent settings through forward update and rollback. Do not clear localStorage, unregister all workers or delete all caches as a routine rollback: this risks local caregiver data and destroys offline availability. Old-cache cleanup belongs to the application update owner and should occur only after the successor is complete and activated, accounting for still-open clients. If rollback cannot read newer storage safely, prefer a forward compatibility fix and communicate the limitation rather than silently dropping profiles.

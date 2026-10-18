# Contributing and checks

Use Node.js 22 and the committed npm lockfile. From the repository root, install dependencies with `npm ci`.

## Pick a focused check

- Source changes: run the relevant Node tests with `npm test` (or `node --test tests/<area>.test.js`) and `npm run build` as appropriate.
- Genre/composer/tone changes: `node --test tests/composition.test.js tests/audioEngineOwnership.test.js tests/audioResources.test.js tests/audioManualVoice.test.js`, then the relevant `e2e/composition.spec.js` checks on desktop and phone-landscape. Check repeated-note playability, movement colour bounds, interpolation, shared audio routing, automation cancellation and actual sampled output. Automated output checks do not replace listening with children-appropriate volume.
- Browser behavior: choose the smallest relevant Playwright file first. `npm run test:e2e:smoke` covers core lifecycle, practice, string voicing, children, and settings on desktop and compact landscape touch.
- Setup, guides and discovery: `node --test tests/learning.test.js tests/caregiverHelp.test.js tests/parentGuide.test.js` and `npx playwright test e2e/learning.spec.js e2e/parent-guide.spec.js e2e/guide-overhaul.spec.js --project=desktop --project=phone-landscape`. Use `page.clock` for active-time rules instead of waiting several real minutes.
- Gesture sequences and guide previews: `node --test tests/gestures.test.js tests/guideDemonstrations.test.js` and `npx playwright test e2e/gestures.spec.js e2e/guide-demonstrations.spec.js --project=desktop --project=phone-landscape`. These inspect contact/release timing, overlapping chord ownership, shared controls, stage progression, silence, and isolated preview settings. When changing a shared game view, also run the relevant real Settings, metronome, or practice browser checks.
- Visual editor: use `npm run test:editor`.
- Release gate: `npm run test:e2e:release` runs desktop and compact landscape touch. `npm run test:production` builds and checks the production service worker and offline behavior. `npm run test:e2e` additionally includes portrait emulation.

Install Chromium with `npx playwright install chromium`. On Linux, Playwright may require its browser system dependencies; use `npx playwright install --with-deps chromium` in CI or an appropriate Linux environment.

For pitched autoplay, compare sampler durations in seconds with the owned event's articulation gate applied. Movement colour can scale authored accents within the documented bounds; keep rhythm, note count, canonical pitches and event ownership exact. Responsive preview assertions should wait for the resized canvas and read related bounds together in one browser evaluation. Before probing coordinates for native gestures, wait for finite instrument-entry transitions with `waitForInstrumentSettling` from the shared browser fixtures.

The Playwright configs use fixed local ports. Production checks require a fresh build and a free production-preview port; do not run a second runner against the same `test-results/production` output at the same time. Failed browser runs retain traces/screenshots under ignored `test-results/`.

## Change boundaries

- Keep authored musical patterns and deterministic voicing in `src/data/` and `src/utils/`. Random draws may select supported progression and motif states; do not replace authored phrases with random individual notes.
- Keep audio scheduling and resource ownership inside the existing audio engine. Reuse the shared transport and stop/release paths for every input surface.
- Preserve family and settings storage formats, per-child isolation, and retry behavior. Treat failed reads as errors, not empty data.
- Keep optional learning suggestions non-blocking. Count time only during focused, visible landscape play outside dialogs; never open a suggestion automatically.
- Keep decorative artwork changes in the existing scene assets/styles, and inspect responsive layouts on desktop and compact landscape touch.
- Do not claim device, browser, accessibility, audio-latency, or release compatibility from Chromium emulation alone.

For the design context see [architecture](architecture.md) and [storage and updates](storage-and-updates.md). See [release validation](release-validation.md) before interpreting gate results.

Repository skills package recurring workflows: [instrument work](../.agents/skills/farmjam-instrument/SKILL.md), [visual editing](../.agents/skills/farmjam-visual-editing/SKILL.md), and [release checks](../.agents/skills/farmjam-release/SKILL.md). They point to these shared references rather than duplicating the architecture.

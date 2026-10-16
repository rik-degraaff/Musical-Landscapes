# Contributing and checks

Use Node.js 22 and the committed npm lockfile. From the repository root, install dependencies with `npm ci`.

## Pick a focused check

- Source changes: run the relevant Node tests with `npm test` (or `node --test tests/<area>.test.js`) and `npm run build` as appropriate.
- Browser behavior: choose the smallest relevant Playwright file first. `npm run test:e2e:smoke` covers core lifecycle, practice, string voicing, children, and settings on desktop and compact landscape touch.
- Setup, guides and discovery: `node --test tests/learning.test.js tests/caregiverHelp.test.js tests/parentGuide.test.js` and `npx playwright test e2e/learning.spec.js e2e/parent-guide.spec.js --project=desktop --project=phone-landscape`. Use `page.clock` for active-time rules instead of waiting several real minutes.
- Visual editor: use `npm run test:editor`.
- Release gate: `npm run test:e2e:release` runs desktop and compact landscape touch. `npm run test:production` builds and checks the production service worker and offline behavior. `npm run test:e2e` additionally includes portrait emulation.

Install Chromium with `npx playwright install chromium`. On Linux, Playwright may require its browser system dependencies; use `npx playwright install --with-deps chromium` in CI or an appropriate Linux environment.

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

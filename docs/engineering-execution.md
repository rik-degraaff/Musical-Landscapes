# Engineering Execution Record

Scope: preserve this local-first children's music toy, its authored musical behavior, independent child settings and voluntary play. No advertising, payments, accounts, telemetry or new feature proposals are implemented. Future possibilities live in [feature-ideas.md](feature-ideas.md).

## Phase 1: Startup And Family Persistence

- Target: failed-load retries, child/scene changes during loading, denied storage and partial writes.
- Mechanism: bind callbacks for every engine attempt; apply the latest committed settings/scene after initialization; reject unmounted/stale publication. Use one guarded storage adapter for reads and writes, retain existing keys and normalization, and keep the legacy-only startup mirror so missing per-child settings still migrate correctly. Keep failed choices usable in-session, show caregiver save status and retry; failed child creation retains its draft.
- Future-proofing: storage is replaceable behind the adapter without a global store or schema change. Unsaved choices also prevent update reloads. Family snapshots preserve sibling settings; browser storage remains fallible, not a backup.
- Validation: delayed startup and retry-then-manual-input tests on desktop/compact touch; getter denial, each write failing, partial mirrors, sibling isolation, draft retention and recovery; existing children/settings contracts.
- Final audit: failed reads prevent fallback writes until a successful reread. Retry recovers saved profiles and merges known in-session edits without clearing active accompaniment; transient getter/family/settings read browser regressions cover this boundary.
- Contingency: keep in-memory choices and retry explicitly; do not clear profiles, overwrite unreadable data on initial load, block musical play due to a failed save, or claim successful persistence. Roll back application code while retaining readable v1 formats.

## Phase 2: Repeated Musical Computation

- Target: repeated profile transposition/voicing, manual sample selection and unchanged practice rendering.
- Mechanism: 96-entry LRU profiles keyed by instrument/key/normalized tier, recursively immutable and detached from authored data; sample candidates prepared once with stable first-insertion ties; exact event comparison for phrase pinning across cache eviction; practice status/hit comparison before publishing results.
- Future-proofing: the existing musical functions remain the authority. No authored pitches, timings, velocities, canonical string/fret mappings or scoring tolerances change. A named uncached builder and independent test reference keep future cache edits measurable.
- Validation: 3,068 differential combinations plus exact eviction/immutability checks, ties and sample parsing, meaningful practice status transitions, browser practice/string-voicing contracts.
- Measurement: illustrative Windows Node medians for 2,400 calls over 24 profiles were about 335 ms for the original uncached builder versus 0.57 ms for warm cache hits. A 768-call miss-only workload cost about 158 ms versus 117 ms reference (35% overhead). Warm hits avoid 39,900 source-map phrase visits in the repeated workload. These are algorithm/tooling observations, not browser/device latency or memory claims.
- Contingency: compare against the independent reference and disable bounded caching if a new workload is miss-dominated. Preserve exact sample tie order and phrase identity; no guessed content changes or speculative loading rewrite.

## Phase 3: Audio And Session Ownership

- Target: disposal/failure while sibling recording loads are pending, immediate retry and obsolete resume work.
- Mechanism: attempt-local resources and generation ownership; publish only a current complete attempt. Cancel initialization promptly but let unavoidable Tone loads settle before disposing their owned buffer once. Named manual-voice disconnect/finish helpers retain fading sources until `onended`; named practice snapshots restore every existing field.
- Future-proofing: retain one Tone transport, direct gesture unlock and the no-argument `initialize()` wrapper contract. Extract responsibilities behind the existing engine API, not a competing clock or state framework.
- Validation: pending instrument/scenery cancellation, late sibling completion, retry isolation, repeated failure, stale resume, zero-valued schedule IDs, owned-node disposal, pinned phrases after cache eviction, full snapshot restoration and native retirement. Browser lifecycle/practice/voicing/note-cleanup checks cover real Tone integration.
- Contingency: stop scheduling and input, invalidate ownership, dispose only attempt-owned resources, and retry with a fresh attempt. Do not dispose a newer session from an old rejection or merely clear references to still-running sources.

## Phase 4: Release And Update Safety

- Target: validate shipped bundles/worker, interrupted first installation and reload safety.
- Mechanism: separate development and production discovery/output; full desktop/compact-touch CI gate, one fresh build and single-worker production preview. First install activates; successor waits through play, loading, setup and unsaved choices, then activates once at a safe menu. Module subscriptions retain early update events.
- Future-proofing: genuine worker update tests change imported worker bytes while preserving coherent asset revisions; no source instrumentation in production checks. Evidence includes browser errors, script hashes, lifecycle counts, caches and decoded recordings. Keep hosting/cross-release/two-tab limits explicit.
- Validation: actual controlled offline navigation and all 192 recordings served by worker and decoded; interrupted worker-owned recording returns 503, install becomes redundant, online reload retries; genuine waiting workers during play/guide, exactly one activation/reload and unchanged family bytes, repeated offline sessions. Scenery release test uses settled native clicks and asserts every transition after a traced forced-click race.
- Final audit: controller replacement rechecks the latest application state. A real-worker activation-reentry regression verifies that a new caregiver draft survives activation and reload waits for the next safe menu, without sending a second activation message.
- Contingency: stop promotion on any failed gate; retain previous-good immutable assets and worker; rehearse actual host rollback and cross-version storage compatibility. Never delete family data, unregister all workers or clear all caches as a routine fix. See [release-validation.md](release-validation.md).

## Phase 5: Caregiver Access And Measurement

- Target: browser zoom and caregiver dialog interaction without losing gameplay multitouch ownership.
- Mechanism: remove viewport zoom limits; allow pinch throughout caregiver CSS ancestors; permit zoom keys/wheel/gestures in menu/setup/Settings, including body-targeted keyboard events. Keep game surfaces `touch-action: none` and existing input resets.
- Validation: native Chromium touch pinch changes caregiver viewport scale but not gameplay; synthetic events and CSS ancestry support the check. Existing focus trapping, scrolling, safe areas and reduced-motion suites remain. Desktop skips only the native touch check.
- Future-proofing: browser capabilities remain browser-owned; no attempted detection of OS app pinning/Guided Access. Alternative accessible play surfaces remain proposals, not implemented features.
- Contingency: investigate any actual target-browser conflict locally rather than restoring a blanket zoom prohibition. Real Safari/iPad, VoiceOver, large-text/device pressure and input-to-speaker measurements require the explicit manual checklist; they are not certified by emulation.

## Deferred By Evidence

The final entry bundle is 756.69 kB (218.64 kB gzip) and offline precache is 17,590.12 KiB across 204 entries. The large-chunk warning remains recorded. Splitting startup audio code or lazy-decoding instrument banks is not justified by a real-device baseline yet and could regress gesture unlocking, complete offline play and key-switch latency. Measure first/warm startup, sustained frames, decoded memory and external audible latency on supported devices before choosing that change. No project-wide state-store rewrite, dual transport, content rewrite or local-data encryption claim was added.


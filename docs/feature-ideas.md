# Child-Centered Future Ideas

Every idea below is **not implemented**. These are possibilities to investigate with children and caregivers, not claims about current behavior or a delivery roadmap.

## Baseline And Phases

The 2026-10-12 Windows / Node 24.18.0 production build at application commit `cb4a58f` measured **756.69 kB JavaScript (218.64 kB gzip)** and **110.10 kB CSS (23.69 kB gzip)**, with **204 precache entries totaling 17,590.12 KiB**. Vite warned about the JavaScript chunk exceeding 500 kB. The historical approximately **751 kB bundle** is contextual, not a reproduced comparison. See [release-validation.md](release-validation.md) for artifact names, conditions and verification boundaries. These are actual build measurements; no Safari/iPad startup, device latency or resident-memory baseline has been measured.

For each of the four ideas: phase 0 establishes caregiver/child needs and records the real-device baseline; phase 1 is a bounded local prototype with explicit acceptance checks; phase 2 is considered only after accessibility, storage and real-device release gates pass. The numerical limits below are proposed prototype bounds, not existing behavior or measured hardware capabilities. Compare build bytes, cache bytes and repeated-session behavior to this baseline, and set latency/memory budgets from actual target-device trials before promotion. Do not infer a device-memory budget from compressed bundle size or a browser test's duration.

## Composition

Not implemented: a small local phrase canvas where a child can arrange notes, rests and scenery sounds, hear changes immediately, undo freely, and save a named creation on the device. Begin with a manageable number of choices and an optional visual alternative to note names. Offer caregiver-controlled export without public sharing, accounts, scoring or comparison. Make stopping and starting over ordinary choices, not lost progress.

- Phase 0 target: observe whether children can distinguish arranging from playing without note-name literacy; record current Play-to-ready and repeated-session memory on real supported devices.
- Phase 1 target/mechanism: one phrase, at most 32 events across eight bars, reusing the existing musical event formats and audio scheduling/ownership rather than a second audio engine. Use a versioned per-child local document, bounded undo history and deterministic replay. Check save/reload equality, undo back to the original phrase, no hanging notes after Stop/menu/background, and continued offline play.
- Phase 2 target: explicit caregiver export/import only after validated round trips, unsupported-version handling and accessible editor navigation. Measure initial/lazy-loaded bytes and repeated edit/play memory against the recorded baseline before expanding phrase length or adding tracks.
- Safeguards: no microphone capture or automatic upload; names stay local; save failure leaves the current phrase intact. Timing choices are expressive options, never a score or pressure to finish.
- Contingency: if memory, complexity or motor effort fails real-device trials, keep a smaller single-phrase editor or defer the idea. Preserve original local documents when rejecting an import or reducing available tracks; never silently truncate saved work.

## Same-Device Duet

Not implemented: two clearly separated playable surfaces for a child and caregiver or two children sharing one device. Explore real multi-touch, independent note ownership, balanced volume and comfortable reach before adding complexity. Make turn-taking optional; neither player should be penalized for pausing. Keep recordings local and require an explicit choice before saving anything.

- Phase 0 target: establish comfortable two-person reach on actual tablets and baseline multi-touch/audio latency with the intended speaker or headphone path, not touch emulation.
- Phase 1 target/mechanism: two bounded surfaces with distinct pointer IDs and voice-owner tokens feeding the existing audio session. Exercise both players holding the same pitch, one releasing, pointer cancellation, rotation and background interruption; releasing one player must not stop the other's note. Balance shared output using the existing gain/limiter path.
- Phase 2 target: offer different instruments only after simultaneous input, CPU/frame-time and peak/post-session memory trials pass on real iPad/Safari. Leave layout choices local and keyboard/switch alternatives equivalent.
- Safeguards: no ranked roles, timing penalties or mandatory turns; cap simultaneous voices from measured hardware limits, with an obvious independent Stop for each player. No saved audio recording is part of the initial prototype.
- Contingency: offer voluntary alternating play when a device cannot handle the simultaneous workload, clearly selected rather than silently dropping notes. Defer dual surfaces if reach or ownership cannot be made reliable.

## Accessible Surfaces

Not implemented: alternative simplified surfaces with larger stable targets, switch access, adjustable input effort, high-contrast cues and equivalent visual feedback for sound. Prototype with disabled children and caregivers rather than assuming one adaptation fits everyone. Offer equal musical possibilities without timing penalties, forced gestures or a separate lesser mode. Check screen-reader interaction and real assistive hardware as part of each prototype.

- Phase 0 target: identify specific access needs with participants, then record supported browser/assistive-device combinations and any unmet needs without claiming universal access.
- Phase 1 target/mechanism: one instrument with adjustable stable target sizes, contrast and an optional low-effort input path. Route pointer, keyboard and switch-triggered actions through the existing note ownership and reset behavior; keep focus order, pressed state and visual/audio cues consistent. Check that each input method can reach the same notes and can stop without a precision gesture.
- Phase 2 target: expand instrument coverage only after real VoiceOver and chosen switch hardware trials, large-text/safe-area checks, and offline/repeated-session validation. Respect reduced motion and avoid duplicating the musical logic for each surface.
- Safeguards: no forced timed scanning or loud feedback; the caregiver can adjust effort and restore defaults without deleting musical work. Do not infer screen-reader or switch compatibility from Chromium keyboard tests.
- Contingency: retain the existing surface as a selectable alternative, document unsupported hardware combinations, and limit scope to the adaptation actually validated. Do not label an untested generic large-button mode as an accessibility solution.

## Caregiver Local Data

Not implemented: a caregiver view for reviewing, renaming, exporting, restoring and deleting local child profiles and compositions. Use clear per-child choices, a preview before replacement, backward-compatible formats and a local backup reminder only when it directly protects a requested action. Explain actual device-storage limits and avoid claiming that local data is permanent or cloud backed. Do not collect behavioral analytics, microphone recordings or identifiers by default.

- Phase 0 target: inventory current `farmjam-children-v1` and `farmjam-settings-v1` data and caregiver recovery needs. The current production update gate already checks their exact retention; composition storage remains only a proposal.
- Phase 1 target/mechanism: explicit per-child versioned JSON export and a read-only import preview using schema validation, file-size bounds and normalized field allowlists. Reject malformed or unsupported files before any write. Check exact round trips, selected-child/settings independence, cancel-without-write and quota failure while preserving original data.
- Phase 2 target: restore/merge/delete only after atomic replacement or a staged original-copy recovery mechanism has been demonstrated, including forward-update/rollback readability and partial-write failures. Destructive choices require an explicit caregiver confirmation; downloaded copies cannot be remotely revoked or guaranteed encrypted by the app.
- Safeguards: backups contain identifying nicknames and must be treated as private; never import executable content or silently replace every child. No account, cloud synchronization, analytics or automatic export. Explain OS eviction and that downloads may outlive in-app deletion.
- Contingency: ship review/export only if safe restore cannot be demonstrated. Preserve versioned originals and prefer a forward compatibility fix over destructive migration; a full device disk or browser-storage deletion can still prevent recovery without a separate backup.

## Boundaries

Keep play voluntary and child-led. No advertising, microtransactions, streaks, engagement targets, notifications designed to pull children back, ranking, public leaderboards or retention pressure. Evaluate ideas by musical expression, accessibility, shared enjoyment and caregiver control, not time spent in the app.

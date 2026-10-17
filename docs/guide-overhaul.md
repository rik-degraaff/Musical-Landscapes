# Guide and direct-coaching overhaul

## Review and design

Two independent model reviewers received the same neutral comparison with reversed option order: an interleaved scrolling reference versus short, freely navigable task pages. Neither received a preferred answer. Both favored task pages for action guides on short landscape screens; one recommended a single page for brief shared-play advice. These are model judgments, not human usability-study evidence.

Both identified missing practice-room orientation, duplicated help/guide paragraphs, vague headings, generic stand-in artwork, and the risk of separating text from its illustration on short screens. The resulting design uses one goal per page, a labeled page selector, Back/Next, a page count, and explicit completion only on the last page. It does not require reading or completing preceding pages.

## Implementation boundaries

- Reuse actual sky, instrument, avatar, metronome and practice artwork. Share pure practice controls between the app and its diagrams. Diagrams are inert and silent; they do not mount an audio engine or activate gameplay.
- Pointing and pressed hands have different geometry and angle. Tap, double-tap, hold, swipe and drag show contact and release. Reduced motion retains readable static contact/destination cues.
- Caregiver guides pair each action with relevant artwork. Installation, offline preparation and device restrictions are separate pages. Short real-world advice is intentionally text rather than a fabricated app diagram.
- Context help answers the current question, including the current practice stage, then links to the relevant guide. It does not repeat a full guide and discovery list.
- Child coaching is a hand over the live target, never a dialog. Starting a suggestion does not reset inputs, change audio or block play. Coach artwork ignores pointer events; optional small replay/stop controls stay away from the target. Equipping and practice may continue through several live steps. Actual actions advance or finish the sequence; demonstrations never synthesize input.
- Suggestions stay local and per child. Offered, viewed, dismissed and completed have distinct meanings. Preserve old viewed-hint dismissal behavior during migration; reopening an unfinished, undismissed coach after restarting remains possible. Age/time rules and explicit parent resuggestion remain in force.
- Existing unrelated metronome/audio/practice working-tree changes are preserved. Any shared metronome-art extraction is staged separately from their existing changes.

## Validation

Check guide navigation and explicit read revisions, early close without completion, parent hint controls and migration, live target geometry after resize, multiple-stage progression, uninterrupted input/audio, reduced motion, keyboard focus and short-screen containment. Re-run affected profile/help/practice/editor checks and build. Record actual results here; previous validation is not evidence for this revision.


### Run evidence, 16–17 October 2026

- `npm test`: 329 passed. Production build passed; the existing large JavaScript chunk warning remains.
- Guide/setup/help/coaching browser batch: 82 passed across desktop and compact landscape touch. Final focused sky-position, reduced-motion, practice Ready and practice-entry/Learn checks: 12 passed after the last caption-placement change.
- Production offline/update suite: 14 passed. After the last caption change and rebuild, the offline reload and guide-update slice passed again on both production projects (4 cases).
- Visual-editor browser checks: 22 passed, 4 intentional skips.
- Practice/settings/metronome regression batch: 38 passed, 2 failed initially. One fixture clicked fixed coordinates now occupied by Help; it now clicks a visible instrument instead. The other failure was a compact startup timeout during parallel validation. Both affected cases passed on both layouts in the final focused run; the startup timeout did not reproduce.
- Desktop and compact screenshots were inspected. Local review artifacts are in ignored `artifacts.local/guide-overhaul/`.

Early runs exposed and led to fixes for nested Escape handling, premature coaching completion, practice overlay stacking, caption overlap, string swipe direction, rejected input completing hints, and keyboard access to coach controls. These checks ran against the working tree with the pre-existing audio/metronome edits preserved and excluded from the overhaul commits.

This is Chromium automation and source review, not a family usability study or real iPad/Safari validation. The neutral model comparisons inform the page design but do not establish which presentation children and caregivers will actually prefer.

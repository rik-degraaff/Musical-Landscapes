# Setup, help and learning implementation

Approved direction: short child setup, caregiver guidance available on demand, optional visual demonstrations, and gentle persistent discovery. No feature is locked by age or tutorial completion.

## Milestones and acceptance

1. **Plan** — record scope, defaults and validation before implementation.
2. **Setup and guides** — familiarity first only if unset; name/age, avatar, starting complexity, then a guide invitation. Remove the unused experience checklist and Apply button. Cancel preserves existing profiles and global familiarity. Settings opens from the main menu without starting audio; Caregiver and Guides are separate from Sound. Guides have explicit completion, versioned unread/new badges and access from setup, Settings and contextual help. Help opens with one tap. Preserve installation/restriction guidance as an optional guide.
3. **Learning** — local versioned storage holds global guide revisions and independent per-child hint state, accumulated active-play seconds and an enable switch. Delay only counts visible, focused landscape play without dialogs. Basic tap advice is available first; landscape after 45 seconds; equip after 120 seconds for ages 3+; weather after 180 seconds for ages 3+; practice after 300 seconds and equipping for ages 5+. Offer at most one suggestion, persist its availability, never open it automatically. A small learning symbol pulses briefly, then stays still until chosen. Viewing, dismissing and performing the real action have distinct state. Parent reset can explicitly suggest any hint again, including below its automatic age threshold. Reusable SVG hand poses illustrate tap, double-tap, drag, swipe and hold; demos are replayable, have text/static equivalents, respect reduced motion and never synthesize gameplay input. Provide pointer alternatives to equipping and practice.
4. **Developer documentation** — concise README, caregiver guide, architecture, storage/update contracts, contribution/check selection guide and dated release evidence. Link the visual editor. Correct stale terminology and scoring descriptions. Add intent/units/ownership comments at high-risk boundaries. A concise AGENTS.md routes to maintained docs; repository skills cover instrument work, visual editing and release checks.
5. **Integration** — update obsolete setup/help test assumptions; test profile isolation, cancel/save failures, guide revisions, hint eligibility/reset/persistence, keyboard/focus, compact layout/reduced motion and production update deferral with new dialogs. Run all Node tests, build, focused desktop/touch browser checks, then production checks. Record actual results and limitations; do not describe historical full-release checks as current evidence.

## Design decisions

- Guide completion belongs to this browser/device; learning hints belong to the selected child. Both stay local. They are preferences, not analytics.
- Guide versions are explicit integers; editing substantive guidance increments its version. Opening a guide alone does not mark it read. An older read revision is labeled New; an unseen guide is Unread.
- Learning persistence uses a separate storage key so existing v1 family/settings formats remain readable. Failed reads block fallback writes; failed saves retain session state and show retry. Draft setup does not modify saved children.
- Shared familiarity remains under its existing key and is saved on successful setup completion or explicit Settings change. Existing legacy values migrate once.
- Teaching overlays and main-menu Settings defer service-worker reloads. Demos never create another audio clock or autoplay recordings.
- Preserve unrelated working-tree artwork changes. Commit only the files belonging to each milestone.

## Progress

- Setup, guide library, learning persistence, age-aware suggestions and shared SVG demos implemented in `3b863c0`.
- Developer documentation reorganized; project instructions and three workflow skills added. All three skills pass the skill validator.
- Full Node suite: 327 passed. Initial corrected desktop setup/learning batch: 23 passed. Broader desktop/compact-touch and fresh-build production checks are in progress; final results will be recorded below.

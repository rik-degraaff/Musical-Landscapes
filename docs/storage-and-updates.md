# Storage and updates

FarmJam stores family and learning data locally in browser storage. An optional parent account uses email sign-in and carries paid or invited access across devices. Local browser storage can be cleared by the user or operating system.

When editions are enabled, the trial stores one age range and the four instrument settings together in `farmjam-trial-v1`. Trial guide read revisions use `farmjam-trial-guides-v1`. Trial setup leaves the family record untouched. Unlocking opens existing full-version families in the same browser and preserves the keys listed below. FarmJam stores the last verified full access locally for offline use and checks the server when it reconnects. Sign-out and account deletion clear that access in the current browser. Local profiles can be removed individually from the child menu. See [PWA release setup](pwa-release.md) for payment and invitation storage.

Environment, scene and weather belong to the current play session. Starting play opens the Farm in Folk. The service worker includes the map, Jungle art and scenery audio in the bundled precache for offline play after installation.

## Records and ownership

- `farmjam-children-v1` stores the family record, selected child, child profile fields, and each child's instrument/display settings.
- `farmjam-settings-v1` is the legacy settings mirror used for compatibility with older installs. It is not the owner of independent child settings.
- `farmjam-caregiver-settings-v1` stores caregiver familiarity shared across profiles. Existing installs can seed it from the selected child's legacy answer once.
- `farmjam-learning-v1` stores guide read revisions and per-child hint preferences/progress, including accumulated active-play time and suggested/seen/completed/dismissed state. It also stores an the per-child practice switch, visit state, and acknowledged practice-guide revision.

The normalization functions and storage adapters in `src/utils/` remain the schema boundary. Preserve existing keys and readable formats when changing fields. New records should be versioned and tolerate missing or unknown fields where feasible.

## Write behavior

Profile edits and deletion use a coordinated write: the legacy settings mirror is written first, then the family record; if the family write fails, the mirror is rolled back where possible. Ordinary settings and child-selection saves write the family record first and then the legacy mirror, so a mirror failure can occur after the family record has already been updated. Profile creation and other ordinary snapshot saves use this latter path. These multi-key writes are not fully atomic. A failed read must not be treated as an empty record and overwritten. If persistence reports a failure, current in-session choices may remain usable, but the UI must not claim they were saved.

`useFamily` keeps family and active settings in one snapshot. Settings changes and child selection remain usable after a failed save; creation, profile editing, and deletion keep their drafts until saving succeeds. After a failed startup read, retry reloads storage and merges each field against the initial in-memory snapshot: explicit local changes win, and untouched fields come from recovered storage. Instrument selections are ordered lists and are recovered as a whole. This preserves previously unreadable instrument options and sibling profiles. Family, caregiver, and learning retries proceed independently, and any remaining failure keeps the save warning and update deferral active.

Before each family save, FarmJam rereads storage and merges the tab's changes against its last acknowledged snapshot. Completed additions and deletions from another tab survive; independent fields merge, and explicit local changes win a field conflict. A completed family write is acknowledged even if its legacy mirror fails, so retry does not replay stale edits. Creation retries reuse the same child ID. A failed fresh read blocks writing. This protects sequential saves from stale tabs; simultaneous localStorage read/merge/write operations are not atomic. Other tabs adopt these changes on their next family operation rather than switching an active play session automatically.

Caregiver familiarity is independent of child selection and is saved on completed setup or an explicit settings change. Learning state belongs to the selected child except for guide read revisions, which are shared. The caregiver can turn all hints on or off for a child, or reset an individual hint without deleting the profile. Guide revisions determine whether a guide is unread or new; merely opening it does not mark it read. An unfinished live hint remains available across reloads. Explicit Stop hint records dismissal; legacy seen hints migrate as dismissed so an upgrade respects earlier choices.

The main-menu practice note uses the learning record read at launch. The in-room book is available on entry while this child’s guide is unread. Both open the same guide. Selecting the turn-taking answer and confirming records acknowledgment for that child. Earlier short-tip acknowledgments remain readable and the updated guide can be offered. Later defers both prompts until the next launch. Disabling practice suppresses its entrances and hint independently of the general learning-hint preference. Profile deletion removes that child’s learning information. Activities, progress, and display-detail choices stay in the room session.

Do not add automatic migration that discards original data. Do not clear all site storage, unregister all workers, or delete caches as a routine recovery step. There is no built-in export or restore workflow.

## Learning-time accounting

Hint elapsed time advances only during focused, visible landscape play. The travel map pauses that clock along with settings, setup, help, guides and menus. FarmJam offers at most one eligible hint at a time, and a child chooses when to open it. Reset and eligibility overrides are explicit caregiver actions.

Age and elapsed-time values in the interface are defaults for when optional suggestions become eligible. They are not child-development standards or claims about readiness.

## PWA update contract

The service worker caches the production app shell and bundled recordings for offline use after a successful installation. Updates can install while the app is open, but activation/reload is deferred until FarmJam is at a safe menu and loading, play, setup, guide/help dialogs, profile edits, and unsaved data no longer require the current page. A pending update must not discard caregiver edits or interrupt playback. Failed saves also defer reload.

The automated production checks exercise real service-worker installation, offline loading, interrupted precache retry, and deferred update behavior in Chromium. They do not establish release-to-release schema compatibility, multi-tab coordination, hosting cache-header behavior, or Safari/iPad behavior. See [release validation](release-validation.md) for the current status and verification boundaries.

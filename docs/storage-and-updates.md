# Storage and updates

FarmJam stores family and learning data locally in browser storage. It has no account or cloud-sync layer. Browser storage is fallible and can be cleared or evicted by the browser or operating system.

## Records and ownership

- `farmjam-children-v1` stores the family record, selected child, child profile fields, and each child's instrument/display settings.
- `farmjam-settings-v1` is the legacy settings mirror used for compatibility with older installs. It is not the owner of independent child settings.
- `farmjam-caregiver-settings-v1` stores caregiver familiarity shared across profiles. Existing installs can seed it from the selected child's legacy answer once.
- `farmjam-learning-v1` stores guide read revisions and per-child hint preferences/progress, including accumulated active-play time and suggested/seen/completed state.

The normalization functions and storage adapters in `src/utils/` remain the schema boundary. Preserve existing keys and readable formats when changing fields. New records should be versioned and tolerate missing or unknown fields where feasible.

## Write behavior

Profile edits and deletion use a coordinated write: the legacy settings mirror is written first, then the family record; if the family write fails, the mirror is rolled back where possible. Ordinary settings and child-selection saves write the family record first and then the legacy mirror, so a mirror failure can occur after the family record has already been updated. Profile creation and other ordinary snapshot saves use this latter path. These multi-key writes are not fully atomic. A failed read must not be treated as an empty record and overwritten. If persistence reports a failure, current in-session choices may remain usable, but the UI must not claim they were saved.

Caregiver familiarity is independent of child selection and is saved on completed setup or an explicit settings change. Learning state belongs to the selected child except for guide read revisions, which are shared. The caregiver can turn all hints on or off for a child, or reset an individual hint without deleting the profile. Guide revisions determine whether a guide is unread or new; merely opening it does not mark it read.

Do not add automatic migration that discards original data. Do not clear all site storage, unregister all workers, or delete caches as a routine recovery step. There is no built-in export or restore workflow.

## Learning-time accounting

Hint elapsed time advances only while the document is focused and visible, gameplay is in landscape, and no dialog blocks play. Setup, menus, Settings, help, and guide dialogs do not accrue it. At most one eligible hint is suggested at once; the app never opens a hint automatically. Reset and eligibility overrides are explicit caregiver actions.

Age and elapsed-time values in the interface are defaults for when optional suggestions become eligible. They are not child-development standards or claims about readiness.

## PWA update contract

The service worker caches the production app shell and bundled recordings for offline use after a successful installation. Updates can install while the app is open, but activation/reload is deferred until FarmJam is at a safe menu and loading, play, setup, guide/help dialogs, profile edits, and unsaved data no longer require the current page. A pending update must not discard caregiver edits or interrupt playback. Failed saves also defer reload.

The automated production checks exercise real service-worker installation, offline loading, interrupted precache retry, and deferred update behavior in Chromium. They do not establish release-to-release schema compatibility, multi-tab coordination, hosting cache-header behavior, or Safari/iPad behavior. See [release validation](release-validation.md) for the current status and verification boundaries.

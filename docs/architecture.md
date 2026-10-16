# Architecture

FarmJam is a React application built with Vite. Its main design boundary is between interface/session coordination, musical planning, audio ownership, and browser persistence.

## Runtime areas

- `src/App.jsx` coordinates the active child, screen transitions, caregiver dialogs, settings, hints, help, and session lifetime.
- `src/components/` implements reusable UI, child setup and profile editing, settings, guides, hint explanations, instruments, and practice controls.
- `src/scenes/` renders the seven landscapes and their interactive objects. `LandscapeArt.jsx` and `scene-art.css` hold authored scenery artwork and styling.
- `src/audio/AudioEngine.js` owns Tone.js initialization, transport scheduling, instruments, audio resource lifecycle, and output mixing. `sampleLibrary.js` maps local recordings; `sceneSounds.js` defines procedural effects.
- `src/data/` contains authored musical phrases and other content.
- `src/utils/` contains normalization, local-storage adapters, musical planning, and reusable state rules.
- `public/` contains static assets and the PWA shell configuration.

## Playback flow

The UI sends active instrument, key, tempo, and equipped-instrument preferences to the audio engine. Musical planning selects authored patterns and deterministically voices them for the current instruments and harmony. The audio engine schedules them on its shared transport. Instrument controls and practice use the same canonical note and ownership rules so release, cancellation, scene changes, and session teardown can clean up their own sounds.

Landscape changes update the requested key. The current bar completes in its captured key; the latest requested key takes effect on the next downbeat. The transport is shared and is not restarted for scene changes.

## State ownership

- Family profile records own child identity, appearance, age range, and child-specific settings.
- One caregiver preference record owns familiarity shared across children in this browser.
- One learning record owns guide read revisions and each child's hint settings and progress.
- React session state owns transient UI, active play, and current sound-mix values.
- The service worker owns cached application assets and its update lifecycle, not family profile data.

Persistence schemas and update safety are documented in [storage and updates](storage-and-updates.md). For a feature-level overview, see [the caregiver guide](caregiver-guide.md). Detailed authored music behavior is in [the musical reference](musical-reference.md).

## Development visual editor

The local-only visual editor previews real application components and saves validated visual overrides to `src/data/visual-overrides.json`. It does not replace source work for behavioral or audio changes. See [visual-editor.md](visual-editor.md).

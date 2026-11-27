# Architecture

FarmJam is a React application built with Vite. Its main design boundary is between interface/session coordination, musical planning, audio ownership, and browser persistence.

The installable web app opens with full access by default. Setting `VITE_FARMJAM_EDITIONS=true` at build time lets PwaApp supply the edition catalog and derive full access from the signed-in parent’s payment or redeemed invite. Supabase handles parent identity and access, Stripe hosts Checkout, and a verified payment event records payment access. Invite redemption is atomic and bound to the verified parent email. The trial uses four instruments, Folk, and two Farm scenes. The service worker caches the web shell and recordings for offline play.

## Runtime areas

- `src/App.jsx` coordinates screen transitions, caregiver dialogs, hints, help, and gameplay session lifetime. `useFamily` owns the active family/settings snapshot, profile save policies, and read recovery; `useCaregiver` owns shared familiarity and its legacy seeding. Each persistence hook reports its own save status, and retry attempts remain independent.
- `src/components/` implements reusable UI, child setup and profile editing, settings, guides, live gesture coaching, instruments, and practice controls.
- `src/data/environments.js` defines each environment's seven-scene cycle, morning entrance and music defaults. `src/scenes/` renders the landscapes, their interactive objects, and the illustrated travel map. Artwork positions on the map share coordinates with the bicycle's route.
- Habitat trees render in a separate foreground SVG at depth 30, above bank structures (20) and below animals and tree-mounted objects (45). Both SVG layers use the same world metrics; editor selectors distinguish the background and foreground.
- `src/data/artStyle.js` holds shared authored illustration materials. [Visual standards](visual-standards.md) define how artwork, habitat anchors, hierarchy, and responsive scale fit together.
- `src/utils/sceneComposition.js` owns object size tiers/contact points, shared tree anchors, and house/doorway/path geometry in actual world pixels. `App` measures the available world with `ResizeObserver`; opening a performance panel updates both illustration scale and habitat positions. Scene objects and scenery consume the same coordinates. Optional editor overrides remain an explicit layer over this authored composition.
- `src/audio/AudioEngine.js` owns Tone.js initialization, transport scheduling, instruments, audio resource lifecycle, and output mixing. `sampleLibrary.js` maps local recordings; `sceneSounds.js` defines procedural effects.
- `src/data/` contains authored musical phrases and other content.
- `src/utils/` contains normalization, local-storage adapters, musical planning, and reusable state rules.
- `public/` contains static assets and the PWA shell configuration.

## Playback flow

The UI sends active instrument, key, tempo, and equipped-instrument preferences to the audio engine. Musical planning selects authored patterns and deterministically voices them for the current instruments and harmony. The audio engine schedules them on its shared transport. Instrument controls and practice use the same canonical note and ownership rules so release, cancellation, scene changes, and session teardown can clean up their own sounds.

Practice owns the shared transport while either room view is active. Guided activities and full exercises keep separate UI state in the same session. The engine schedules model sounds, echo lead-in and response boundaries, and accompaniment on the shared clock. Run identity invalidates stale callbacks after cancellation. The landscape bar callback remains registered but cannot advance composition history, publish harmony, or queue tone automation during practice. Leaving practice restores the landscape state and starts a fresh composition timeline at bar zero.

Tempo holds resume only the active practice run, preserving its transport position and accompaniment. Holds before its scheduled start restart one complete count-in; idle or stopped practice stays stopped. Practice input and expiry use transport ticks at the current audio time rather than the scheduler's lookahead time.

Each owned startup load has a 15-second deadline. A stalled recording returns the menu to its retryable error state. The failed attempt retains ownership of any unfinished browser decode until it settles, preventing late completion from changing or disposing a newer attempt.

Landscape changes update the requested key. The current bar completes in its captured key and the latest requested key takes effect on the next downbeat. On a bicycle trip, arrival requests the destination's morning key and default genre before the map folds away. The transport continues through the trip. Opening the map releases held input and suspends learning time while the dialog owns focus.

Composition styles also own per-instrument tone cutoff, articulation gate and accent depth. The movement planner derives a small, fixed colour from each movement seed and blends it at movement handoffs; genre interpolation supplies the larger change. Immutable bar plans carry the resulting performance settings and gated events. The engine schedules gentle high-frequency shelf automation at the bar's audio timestamp and routes both sampler and manual voices through the same resource-owned filter before the existing mixer/reverb. The shelf only attenuates (up to 4 dB); it never boosts. A separate resource-owned style gain node follows the shelf and precedes the user mixer. It applies the genre’s bounded −2 to +1.5 dB trim to both sampled and manual pitched voices; bar-time automation and cancellation follow the same ownership as tone. User volume values and mute state are not changed. Replanning replaces future automation, and playback cleanup cancels it.

## State ownership

If a genre blend is reversed before finishing, the new tone/articulation transition starts from the current intermediate style settings rather than jumping to a genre endpoint. This transient snapshot lives only in the engine's genre transition and participates in composition cache identity.

- Family profile records own child identity, appearance, age range, and child-specific settings.
- One caregiver preference record owns familiarity shared across children in this browser.
- One learning record owns guide read revisions and each child's hint settings, practice preference, and caregiver acknowledgment.
- React session state owns transient UI, active play, the current environment and weather, and current sound-mix values. Starting a new session begins on the Farm in Folk.
- The service worker owns cached application assets and its update lifecycle, not family profile data.

Persistence schemas and update safety are documented in [storage and updates](storage-and-updates.md). For a feature-level overview, see [the caregiver guide](caregiver-guide.md). Detailed authored music behavior is in [the musical reference](musical-reference.md).

## Gesture demonstrations

`src/utils/gestures.js` owns the passive gesture timeline: tap, double tap, hold, drag, swipe, and tempo movement. Call `gestureFrame` with elapsed time, start/end coordinates, optional waypoints, duration, speed, reduced-motion preference, and repeat count. `GesturePointer` renders both hand poses and a brief contact burst with a shared fingertip anchor and shared styling. Guides measure their rendered controls; live hints measure the real play targets. Neither demonstration dispatches input or acquires audio resources. Movement maintains contact until arrival, releases at the destination, and fades before repeating. Reduced motion keeps static contact and route cues.

`guideDemonstrations.js` composes delayed gesture tracks and passive practice state on one clock. Change its duration constants to adjust pacing; add a track to describe another hand or dependent action. String guides hold a chord before and throughout the second hand's sweep. Wind guides use canonical fingering helpers, and pipe cues follow the moving hand. Practice examples select an existing short authored phrase, then show stage-specific readiness, count-in, cues, progress and completion. Demonstration timing is illustrative; scoring and audio remain owned by the real practice session.

The game and guides share `SettingsButton`, `InstrumentActions`, `SettingsControls`, the metronome mechanism and sound switch, and the practice tabs, selectors, readout, phrase track, duration bar, progress and transport. Guide components compose these views with `GuideInstrumentSurface`, an inert real instrument surface with a silent adapter. Do not draw separate copies of game controls in guides or mount stateful dialogs/engines inside previews. `useDemonstrationTargets` resolves hand positions from rendered controls and cue notes. Guides default to Simple controls without charts or note labels; the reader can explicitly preview the child's saved controls. This preview never saves settings.

Practice previews share `PracticeRoomLayout`, the guided activity views, and the full room's header and controls. `ScaledGamePreview` fits the current game viewport into the illustration without rearranging controls. Its transformed canvas contains fixed-position descendants and excludes caregiver article width and animation styles. Keep room layout in `practice.css`. Guides pass a silent instrument adapter to these views. Live guided activities use canonical controls and exercise recipes from `guidedPractice.js`. The full phrase library remains in `practiceComposition.js`.

## Development visual editor

The local-only visual editor previews real application components and saves validated visual overrides to `src/data/visual-overrides.json`. It does not replace source work for behavioral or audio changes. See [visual-editor.md](visual-editor.md).

## Instrument availability

`src/utils/featureFlags.js` owns instrument availability. `FEATURE_FLAGS.flute` is currently false. Set it to true to restore the retained flute implementation. `INSTRUMENTS` remains the complete definition catalog for persistence and implementation tests; runtime UI, editor and audio entry points enumerate `AVAILABLE_INSTRUMENTS`. Saved disabled slots are replaced individually with an unused enabled default, preserving the other five slots and the hidden instrument’s saved options. Pan flute remains available.

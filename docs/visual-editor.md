# Development Visual Editor

Run `npm run dev:editor`, then open `http://127.0.0.1:5175/__editor`. The editor also works at `/__editor` on any freshly started localhost Vite development server. Restart an older development server after adding the editor plugin. The editor UI and save endpoint are not included in production builds.

## Editing

- **Scene** renders the real `App`, with an in-memory child and settings. Its layout, instrument settling, scene components, responsive CSS, and avatar renderer are the game's own implementations. Choose any of the seven scenes and regular objects or either visitor.
- **Objects** shows all 28 scenery objects and all eight instruments, using their actual SVGs and reaction CSS. **Character** opens the real caregiver dialog directly on its avatar step. **Menu** uses the real child-selection screen with a preview profile.
- Use **Select** to inspect an item, **Drag** to move scene objects, the child, instruments, or decorative SVG groups, and **Interact** to try the normal controls. The layers icon selects individual SVG shapes. The searchable outline and **Browse SVG parts** also reach covered shapes, gradient stops, and reaction/effect layers.
- Edit SVG path text (`d`), points, shape coordinates, transforms, fills, strokes, opacity, and gradient colors in the side panel. Colors have swatches as well as text fields. Placement exposes CSS percentages and the original responsive expressions, including `clamp()`, `min()`, `max()`, and `calc()`.
- Scenery drags record an SVG-coordinate CSS translation. Ground objects retain their percentage baseline and responsive size; airborne objects retain their percentage center. Child/instrument positions use percentage centers. Geometry and color changes apply to the matching asset across views; landscape artwork changes are scoped to its scene. Object placement is scoped by sound, instrument placement by instrument ID, and avatar artwork by its hair/top/bottom combination.
- **Compact viewport only** limits a selected item's override to a maximum viewport width. Each selector currently has one rule: enabling this changes that rule's scope rather than creating a second desktop/compact variation. Built-in responsive rules remain underneath it. Reset a property to return to the renderer's original value.
- Pause/resume and replay animations from the toolbar. The object lineup also has an instrument animation toggle. Choose the reaction or animated SVG group to edit its duration, delay, timing curve, iteration count, or transform origin. Optional sound initializes the real sound engine; default previews are silent.
- Enter viewport dimensions, use a device preset, or drag the lower-right resize handle. Fit zoom scales the iframe visually; the inner game still receives the exact displayed viewport dimensions. Portrait retains the game's orientation guard.

## Saving And Isolation

Edits live only in the editor's memory until **Save to project** writes `src/data/visual-overrides.json`. The game loads this committed-format file in development and production. The initial empty file leaves the artwork unchanged. Saving uses a fixed file path, localhost/same-origin checks, visual-property validation, an atomic file replacement, and a content revision check. A stale editor cannot overwrite an external edit: export its draft and reload instead.

Undo/redo, per-property reset, selected-item reset, discard, JSON export/import, and an unsaved-navigation warning are provided. Drafts are not automatically persisted. Export a draft before restarting or leaving the editor if it is not ready to save. Vite may reload after a save. Preview profiles/settings never use the game's local storage.

## Limits

This is a visual property editor, not a vector drawing program or arbitrary JavaScript editor. Paths are editable as SVG text; there are no Bezier handles. It does not create/delete scene entities, rewrite React structure, edit audio synthesis or recordings, or change the collision/settling algorithm, celestial motion calculations, animation keyframe bodies, and other JavaScript constraints. Those still require source changes. CSS placement/size formulas, SVG transforms, and animation timing are editable.

Overrides address SVG elements by their renderer hierarchy. Major source changes that reorder shapes can invalidate a saved selector; review/reset affected overrides when refactoring artwork. Child appearance choices and age are preview inputs, not changes to the game's default avatar or a saved family profile. The lineup uses larger fixed display sizes for inspection; use Scene/Character/Menu for exact layout checks. Sound playback and physical-device behavior still need manual verification.

## Validation

Run `npm run test:editor`. The Node tests exercise real filesystem persistence in temporary directories, rejecting unsafe/cross-origin/stale writes. Browser tests use a mocked save endpoint so validation never modifies your project's artwork. They cover live SVG edits, undo/redo, isolated drafts, the normal game's saved-file loader after reload, the real character dialog, animation reactions, visitor choices, viewport dimensions, compact-only restoration, and native object/avatar/scenery dragging. Native mouse dragging is desktop-only; other editor checks run on desktop and compact touch Chromium. These are focused development checks, not the full release gate.
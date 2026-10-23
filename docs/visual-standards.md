# Visual standards

FarmJam is a warm illustrated musical world for young children. The child, instruments, animals, buildings, and sky should look as if they belong to the same picture book. This guide owns the visual direction; [visual-editor.md](visual-editor.md) explains editing mechanics and [contributing.md](contributing.md) owns validation commands.

## Shape, color, and detail

- Use rounded, confident silhouettes with friendly expressions. Prefer a clear side or front view. A three-quarter view must use one consistent camera: far wings/legs are smaller and painted behind the body; near parts are in front. Never mix a top-view wing with a side-view tail.
- Use the shared material palette in `src/data/artStyle.js` for authored illustrations. Cream, muted gold, terracotta, sage, teal, dusty blue, and soft violet are the core colors. Skin, hair, eyes, and clothing remain the child's chosen colors; do not remap persisted choices.
- Use dark green-gray contours with rounded joins/caps. At a 160-unit asset width, the normal silhouette outline is 2.5 units and internal detail is 1.5 units. At the avatar's 130-unit width use 2 units. Strong structural lines (legs, stems, rails) may be thicker when their shape needs it. Background scenery uses fills and subdued internal lines rather than object-weight contours.
- Prefer flat color with one quieter shade or highlight per material. Reserve restrained gradients for a large sky/water surface or a broad instrument material; avoid glossy stripes, tiny texture, ornamental knots, and many competing near-identical colors.
- Each asset needs a recognizable silhouette and at most a few identity details readable at its smallest game size. Keep the woodpecker's crest, beak, and wing bars; remove its freestanding detailed log. Keep instrument keys, strings, holes, and canonical playable markings where they communicate identity or instruction.
- Put decorative detail inside the silhouette. Clip or repaint trim so it cannot erase the outer contour. Put highlights, markings, and claws in the same animated group as their owning part.

## Habitat and composition

- Animal artwork contains the animal, not a miniature habitat. Trees, branches, flower beds, banks, logs, and ground texture belong to `LandscapeArt`. Perching birds and the woodpecker attach to named features of the existing trees. Idle water reflections belong to the pond; reaction ripples can belong to the reacting animal. Intrinsic instrument/building supports such as bell hangers and windmill towers remain part of those objects.
- Keep the seven landscapes distinct through broad sky/ground colors, terrain, and a few landmarks. Reduce foreground texture and house detail before shrinking important interactive content. Avoid placing a small animal over a busy fence, flower bed, or path of the same value.
- The child is the central social anchor. Instruments are the primary playable layer, with a consistent apparent size and a calm space around the child. Scene objects form a secondary, readable pair. The sun/moon and weather clouds are tertiary controls in the upper sky; background landmarks stay quieter than those controls.
- Use one subtle shadow treatment for floating game illustrations and restrained ground contact shadows for grounded animals. Do not stack multiple dark CSS shadows with a painted shadow. Feedback may brighten gently; avoid a permanent glow on idle items.

## Responsive placement

`src/utils/sceneComposition.js` is the authored source for size tiers, animal contact points, tree metrics, and house doorway/path geometry. `src/scenes/object-placement.css` supplies the world-relative instrument/child scale. Read those sources before adding an exception; the empty `visual-overrides.json` now represents the accepted baseline.

- Place scene objects from one authored catalog of habitat anchors and size tiers. Ground animals share a baseline band, swimmers sit in the actual water, perched/clinging animals align with an existing tree, and airborne items occupy open sky. Preserve these relationships when an instrument panel reduces the world's height.
- Sizes respond to both available world width and height, with bounded minimum and maximum values. Use the same scale rule for regular objects and visitors. Normalize the visible drawing inside its SVG before adjusting its size; do not compensate for unused viewBox space with arbitrary per-asset pixel sizes.
- Use the real landscape world's dimensions, not the outer browser height, when a performance panel is open. Keep minimum touch bounds at 44 CSS pixels where space allows; artwork may be smaller inside the hit area. Never distort an illustration to fill a target.
- Reserve the caregiver corners, metronome, child/equipped-instrument area, celestial control, and weather clouds. Instruments settle around scene targets using actual rendered bounds and the largest weather silhouettes, so a genre change does not cover a cloud. Short worlds use smaller clouds on a consistent sky row, shifted sideways around the scene's settled sun/moon target. Never lower a cloud behind the terrain or into foreground animals. Respect the device's safe-area insets for corner controls and their expanded menus. Keep every target inside the world and reachable. Broad, short, square, minimum-size landscape, and tall/portrait layouts must be considered; portrait preserves the orientation guard.
- Intentional environmental overlap is useful (a bird on a tree); overlap between unrelated interactive silhouettes is not. Airborne reactions may travel briefly but return to their anchor. Reduced motion preserves a readable resting pose and feedback.
- Reserve both possible airborne visitors when arranging a scene's clouds. A random visitor roll must not move the weather controls or instrument homes; balloons, moths and shooting stars need an open sky area separate from the sun/moon and clouds.
- Give the composition broad depth bands: landmarks and large structures on the middle-distance slopes, grounded animals near the foreground, and airborne visitors in the sky. A far house can appear comparable to a much closer animal, but a foreground insect still needs a touchable target. Use the catalog's small/medium/large tier relationships rather than literal biological scale or independent per-screen adjustments.
- Derive roads from the actual doorway's bottom edge and width, and widen them toward the foreground. Apply the same scale and origin to the house and doorway. Never position a road separately by eye; check all five house-bearing scenes after a landmark or aspect-ratio change.
- Editor overrides are deliberate exceptions, not a second competing layout system. Integrate accepted composition changes into the authored catalog and remove obsolete fixed positions. Keep semantic SVG anchors stable and review saved selectors after restructuring artwork. The editor's library stays centered at an inspection size, independent of scene positioning.

## Controls and instructional art

Use the existing Lucide icon family for interface actions, with consistent stroke and button treatment. Do not turn controls into miniature shaded illustrations. Caregiver text and teaching labels retain the existing readable UI type. Guides and previews compose the real avatar, instrument, metronome, and practice components; do not draw alternate versions with different proportions or markings.

## Review and evidence

Inspect every affected asset at game size and enlarged, at rest and during reaction. Inspect all top/bottom combinations after shared avatar changes. Review all seven scenes with regular objects and both visitor tiers, with and without an instrument panel, at wide desktop, tablet/square, phone landscape, short landscape, and the 360 × 240 minimum. Include the 1920 × 1080 maximum when changing scale rules. Check actual pointer reachability and normalized geometry, not screenshots alone.

Run the focused checks from `docs/contributing.md` once after the affected files are stable. Update tests when a deliberate composition change invalidates old coordinates while preserving visibility, reachability, drag/equip, and ownership assertions. Do not remove a failing assertion merely to accept a visual change. Record current results accurately and distinguish them from historical release evidence. Browser emulation does not establish real-device appearance.

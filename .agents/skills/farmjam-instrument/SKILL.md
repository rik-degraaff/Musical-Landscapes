---
name: farmjam-instrument
description: Change FarmJam instruments, authored patterns, practice behavior, or audio playback while preserving musical and audio-ownership contracts.
---

# FarmJam instrument work

Read [the musical reference](../../../docs/musical-reference.md) and the relevant source before editing. Keep authored patterns deterministic, preserve canonical instrument mappings, and route playback through the existing audio engine and shared transport. Manual input, autoplay, and practice must share note ownership and cleanup rules so release, cancellation, scene changes, and teardown cannot leave stale sound.

Use [the architecture guide](../../../docs/architecture.md) to locate responsibilities and [contributing checks](../../../docs/contributing.md) to choose focused tests. Do not infer audible quality or device latency from browser assertions.

# FarmJam agent guidance

Start with [README.md](README.md) for setup and [docs/architecture.md](docs/architecture.md) for system boundaries. Read the relevant maintained guide before changing a subsystem:

- Profiles, caregiver setup, help, guides, or hints: [docs/caregiver-guide.md](docs/caregiver-guide.md) and [docs/storage-and-updates.md](docs/storage-and-updates.md).
- Persistence, schemas, offline behavior, or app updates: [docs/storage-and-updates.md](docs/storage-and-updates.md).
- Musical patterns, instruments, or audio behavior: [docs/musical-reference.md](docs/musical-reference.md).
- Artwork/layout: [docs/visual-editor.md](docs/visual-editor.md).
- Test selection and contribution invariants: [docs/contributing.md](docs/contributing.md).
- Release evidence: [docs/release-validation.md](docs/release-validation.md).

## Repository invariants

- Keep family data per child and caregiver familiarity shared. Preserve existing storage keys/formats and retry semantics; failed reads are not empty state.
- Keep audio resource ownership and scheduling in the existing engine and shared transport. Release/cancel paths must not leave held notes or let stale sessions dispose newer resources.
- Keep optional hints user-controlled and non-blocking. Time counts only in visible, focused landscape play outside dialogs; no hint opens itself.
- Preserve authored, deterministic music behavior and the current scene-change downbeat boundary.
- Select the smallest relevant checks from `docs/contributing.md`. Do not report historical gate results as current verification.

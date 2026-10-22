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
- Keep genre tone and articulation in composition style data and movement plans. Bound within-genre colour below genre differences, blend at existing transitions, and route manual and sampled voices through the same owned tone path. Keep accents gentle for young children; do not add distortion or unbounded gain.
- Select the smallest relevant checks from `docs/contributing.md`. Do not report historical gate results as current verification.

## Efficient validation

- Run each relevant check once. Repeat a passed check only when a later change affects its coverage or new evidence calls its result into question. Investigate failures, then rerun the failed cases before considering a broader gate.
- When the user authorizes delegation, use a cheaper subagent for routine validation. Give it the exact remaining checks and existing results so it does not repeat completed work; have it report the outcome and evidence.
- For long-running checks, use a completion notification or delegate waiting to a cheaper subagent. Do not keep the primary agent active with repeated status/log polls, sleeps, or idle progress messages. Prefer a process-exit wait or completion event, then inspect the result and diagnostics when notified.
- While delegated checks run, do independent work or wait for the report. Do not repeatedly poll logs, duplicate the checks, or launch competing browser runners. Record split runs and targeted retries accurately instead of claiming a clean full run.

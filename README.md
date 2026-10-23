# FarmJam

FarmJam is a touch-first music toy for children. Choose a child profile, then explore instruments, landscapes, and musical patterns. Profiles and preferences are stored in the browser on this device.

## Quick start

Prerequisites: Node.js 22 and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Create a production build with `npm run build`.

## Useful links

- [Caregiver guide](docs/caregiver-guide.md)
- [Architecture](docs/architecture.md)
- [Storage and updates](docs/storage-and-updates.md)
- [Contributing and checks](docs/contributing.md)
- [Release validation](docs/release-validation.md)
- [Musical and instrument reference](docs/musical-reference.md)
- [Development visual editor](docs/visual-editor.md)
- [Visual standards](docs/visual-standards.md)
- [Engineering execution record](docs/engineering-execution.md)
- [Future ideas](docs/feature-ideas.md)

## Project layout

- `src/App.jsx` coordinates screens, profile selection, settings, dialogs, and the active session.
- `src/components/` contains the React interface and instruments.
- `src/audio/` owns Tone.js playback, audio resources, and transport.
- `src/data/` and `src/utils/` hold authored musical material and deterministic planning.
- `src/scenes/` contains landscapes, objects, and responsive placement.
- `tests/` contains Node tests; `e2e/` contains Playwright browser checks.

See [architecture.md](docs/architecture.md) for boundaries and data flow.

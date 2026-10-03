# Musical Landscape

A touch-first React/Vite music toy for small children. Instruments can be dragged around the landscape and tapped on/off. The music is generated from a library of hand-written one-bar patterns rather than generated note-by-note.

## Run

```bash
npm install
npm run dev
```

Then open the Vite URL shown in the terminal.

Run the phrase-library checks and production build with:

```bash
npm test
npm run build
```

## Structure

```text
src/
  App.jsx                 App state, dragging, scene rotation and UI wiring
  main.jsx               React entry point
  styles.css             All visual styling and scene artwork
  audio/
    AudioEngine.js        Tone.js instruments, mixer, transport and scene sounds
  data/
    (reserved for future content packs)
  utils/
    music.js              Musical constants, pattern library and nearest-neighbour selection
    noise.js              Dependency-free 1D Perlin noise
  components/
    Instrument.jsx        Draggable/tappable instrument shell
    InstrumentArt.jsx     Instrument illustrations
    Mixer.jsx             Child-friendly mixer
    StartScreen.jsx       Audio-unlock screen
    NoteParticles.jsx     Reusable particle component
  scenes/
    Scene.jsx             Scene registry and rotation control
    FarmScene.jsx         Cow + tractor
    GardenScene.jsx       Leaky faucet + bird
    PondScene.jsx         Frog + windmill
    NightScene.jsx        Bell + owl
```

## Musical system

Each instrument has its own pair of independent 1D Perlin noise fields:

- one controls **energy**
- one controls **complexity**

Every hand-written bar has an `(energy, complexity)` coordinate. At each bar the two noise values define a point in that 2D space. The engine uses Euclidean nearest-neighbour selection to choose the closest authored bar for that instrument. Each instrument now has its own phrase library, including different chord voicings, rests, off-beat accents, subdivisions and note strengths.

This means the music can move gradually through the pattern library while still being constrained to known, musical phrases. Instruments do not all follow the same path because their noise fields use different seeds and speeds.

Changing the landscape also changes the musical root. The pattern library is written around C and is transposed to each scene's root at scheduling time. Percussion labels are kept intact during transposition.

## Instrument sounds

The six instruments use different synthesis approaches and envelopes so they occupy different musical roles:

- **Piano** — a bright FM strike with a quick hammer-like attack and a short, soft tail.
- **Drums** — tuned membrane synths for kick and tom, filtered noise for snare and clap, metallic partials for closed hats, and soft noise for shaker.
- **Bass** — a low-passed, lightly layered saw with a short filter envelope for a rounded pluck.
- **Trumpet** — a harmonically rich saw tone shaped by a brass-like filter sweep and gentle vibrato.
- **Marimba** — a woody, inharmonic FM strike with a fast decay.
- **Flute** — a nearly pure tone with a slower breath-shaped onset, quiet filtered breath noise and subtle vibrato.

A shared, low-mix convolution reverb adds space, and a master limiter controls the combined level when many instruments play together. Tone.js generates the reverb impulse response asynchronously, so the start button waits for it before enabling the instruments. These are synthesized, child-friendly timbral approximations rather than recordings of acoustic instruments.

The sound design follows Tone.js's [FM synthesis](https://tonejs.github.io/docs/15.1.22/classes/FMSynth.html), [membrane drum](https://tonejs.github.io/docs/15.1.22/classes/MembraneSynth.html), [polyphony](https://tonejs.github.io/docs/15.1.22/classes/PolySynth.html) and [reverb readiness](https://tonejs.github.io/docs/15.1.22/classes/Reverb.html) guidance.

## Audio behaviour

- Tapping an instrument ramps its gain in over ~35 ms.
- Tapping it again ramps it to -60 dB immediately and releases sustained voices.
- Transport events check the instrument's current active state before playing, so inactive instruments do not continue making notes.
- If all instruments are off, the transport stops and resets.
- Interactive scene sounds are quantized to the next quarter-note when music is running and use notes belonging to the current scene key.
- All four scenes have at least two interactive objects.
- Instrument volume settings are remembered when a muted instrument is switched back on.
- Instrument cards can be toggled from a keyboard as well as by touch or mouse; the scene, mixer and object controls use standard button clicks.

## Scenes

1. **Sunny Farm** — cow and tractor
2. **Little Garden** — leaky outdoor faucet and bird
3. **Pond Meadow** — frog and windmill
4. **Sleepy Night** — bell and owl

The circular weather-vane-like control in the bottom-right rotates through the scenes.

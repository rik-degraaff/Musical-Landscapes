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

Install the browser once and run the desktop and touch-phone checks with:

```bash
npx playwright install chromium
npm run test:e2e
```

The browser suite starts Vite locally. It measures actual Web Audio waveforms for all six instruments and ten scene objects, decodes all bundled recordings, tests failed-load retry, verifies saved gain corrections and full-mix headroom, exercises rapid toggles and repeated taps, checks dragging, cancellation, keyboard control, audio suspension recovery, mixer persistence and reduced motion, and captures each landscape at desktop, portrait phone and compact landscape sizes. Screenshots and failure traces go into the ignored `test-results/` directory.

## Structure

```text
src/
  App.jsx                 App state, dragging, scene rotation and UI wiring
  main.jsx               React entry point
  styles.css             Instrument illustrations and shared UI styles
  audio/
    AudioEngine.js        Tone.js instruments, mixer, transport and scene sounds
    sampleLibrary.js      Local instrument recordings and acoustic drum mappings
    sceneSounds.js        Original deterministic procedural sound effects
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
    LandscapeArt.jsx      Responsive illustrated backgrounds for all five worlds
    ObjectArt.jsx         Matching interactive object illustrations
    scene-art.css         Scene styling and object-specific animation
    FarmScene.jsx         Cow + tractor
    GardenScene.jsx       Outdoor faucet + bird
    PondScene.jsx         Frog + windmill
    NightScene.jsx        Bell + owl
    DawnScene.jsx         Rooster + wind chimes
```

## Musical system

Each instrument has its own pair of independent 1D Perlin noise fields:

- one controls **energy**
- one controls **complexity**

Every hand-written bar has an `(energy, complexity)` coordinate. At each bar the two noise values define a point in that 2D space. The engine uses Euclidean nearest-neighbour selection to choose the closest authored bar for that instrument. Each instrument now has its own phrase library, including different chord voicings, rests, off-beat accents, subdivisions and note strengths.

This means the music can move gradually through the pattern library while still being constrained to known, musical phrases. Instruments do not all follow the same path because their noise fields use different seeds and speeds.

Changing the landscape also changes the musical root. The pattern library is written around C and is transposed to each scene's root at scheduling time. Percussion labels are kept intact during transposition.

## Instrument sounds

All six instruments now play recorded samples through Tone.js Sampler instead of custom oscillator synthesis:

- **Piano**: sampled acoustic grand piano with natural hammer attacks and resonant decays.
- **Acoustic guitar**: nylon-string recordings, new fingerpicked phrases and chord voicings; chord notes are staggered by 16 ms for a gentle strum. This replaces the former bass instrument.
- **Drums**: recorded MuldjordKit kick, snare, closed hi-hat and tom, plus a CC0 hand clap. Shortened snare/hat recordings provide stylized rim/shaker accents, not separate rim or shaker recordings.
- **Trumpet**: sampled brass attacks and body rather than a saw oscillator.
- **Marimba**: sampled wooden bars with natural attack and decay.
- **Flute**: recorded flute tone, including its natural breath character.

The five pitched instruments use a compact selection of FluidR3 GM recordings distributed by MIDI.js Soundfonts. Nearby notes are repitched by at most two semitones across every authored phrase and landscape key. These are compact single-dynamic soundfont samples, not large studio libraries with multiple velocity layers or continuous wind-instrument looping; very long notes are limited by each recording's length.

All 43 audio files are bundled under `public/audio/instruments/` (about 1.63 MB total), so runtime playback has no sound-CDN dependency. The Play screen waits for every sample to decode and for the reverb to be ready. Failed loads show a retry instead of enabling silent instruments. A short, restrained convolution reverb adds space to pitched instruments; the acoustic drums remain dry and all voices feed the master limiter.

Credits and sample licenses are included in [the attribution document](public/audio/instruments/ATTRIBUTION.md). FluidR3 samples follow the distribution's CC-BY 3.0 notice, MuldjordKit uses CC-BY 4.0, and the clap is CC0. Upstream drum license documents are included alongside the audio.

To reproduce the sample downloads:

```bash
npm run samples:download
```

The downloader parses the soundfont data without executing remote JavaScript, extracts selected MP3s without re-encoding, checks FLAC signatures, and downloads the upstream drum license files.

## Audio behaviour

- Tapping an instrument ramps its gain in over ~45 ms.
- Tapping it again ramps it to -60 dB immediately and releases sustained voices.
- Transport events check the instrument's current active state before playing, so inactive instruments do not continue making notes.
- If all instruments are off, the transport stops and resets.
- Interactive scene sounds respond immediately, independently of the musical transport. Three voices per object support overlapping taps without cutting off other objects.
- Audio unlock begins inside the Play gesture, and subsequent instrument/object gestures resume audio after a browser suspension.
- Bar downbeats use the transport callback's audio timestamp directly; later notes use transport positions. Drum labels map to explicit sampler pitches and hit-specific durations.
- All five scenes have at least two interactive objects.
- Instrument volume settings are remembered when a muted instrument is switched back on.
- Opening the mixer requires two clicks or taps within 450 ms; a single click/tap still closes it. Keyboard users can activate the focused mixer button twice with Enter or Space.
- The mixer has one shared **Scenery sounds** slider for all non-instrument sounds, including a mute setting at -60 dB. Its setting persists across scenes and does not alter instrument levels.
- Instruments can be toggled from a keyboard as well as by touch or mouse; canceled drags are cleared without toggling. Scene, mixer and object controls use standard buttons.

## Scenes

1. **Sunny Farm** — cow and tractor
2. **Little Garden** — outdoor faucet and bird
3. **Pond Meadow** — frog and windmill
4. **Sleepy Night** — bell and owl
5. **First Light** — a rising sun over misty fields, a recorded rooster crow and swaying wind chimes

The circular arrow control in the bottom-right rotates through the scenes. The illustrations include rolling fields, a flower garden, reflective pond water, and a moonlit woodland with fireflies. Scenery proportions adapt to portrait and landscape screens.

## Interactive objects

Each object has a distinct sound and a replayable response: the cow nods and moos, the tractor rattles with exhaust, the faucet makes three gentle drips with animated falling drops and impact ripples, the bird flies and chirps, the frog leaps and croaks with ripples, the windmill spins faster with airy wooden clacks, the bell swings and rings, and the owl blinks and hoots. Reduced-motion preferences are respected.

The faucet uses one shared audio/animation timeline: quiet drop impacts at 0.28, 0.93 and 1.58 seconds, with silence between them. Animation start time accounts for the browser audio-output clock. Repeated taps restart the faucet sequence instead of stacking multiple leaks. Other scenery sounds retain their overlapping tap voices.

The faucet now uses an actual recorded water drop rather than a synthesized plop; the sunrise rooster is also a real recording. Both are CC0, bundled locally, and credited in [Scenery Attribution](public/audio/scenery/ATTRIBUTION.md). Other object sounds are original procedural effects rendered to local WAV assets offline. No sound CDN is used during playback. Samples have tapered endpoints; the master limiter also covers scene sounds.

## Measured Default Balance

Every one of the 53 playback assets is decoded and analyzed offline using FFmpeg: integrated EBU R128/BS.1770 loudness (LUFS), full-waveform RMS, gated active RMS, and true/sample peak. Silence is excluded from the active RMS calculation using 50 ms blocks within 20 dB of the loudest block. Gated active RMS is the fallback for clips too short to yield finite integrated LUFS.

The analyzer precalculates a gain toward -20 LUFS for instrument recordings, -23 LUFS for scenery, and a deliberately quieter -26 LUFS target for dripping water. Corrections are bounded to -24 through +18 dB and constrained by a -5 dBFS true/sample-peak ceiling. Transient-heavy samples may remain below the loudness target to preserve their peaks; this is linear gain, not compression. The instrument mixer defaults and authored note velocities then retain the musical foreground/accompaniment balance.

The complete measurements, asset SHA-256 hashes and gains are committed in [audioLevels.json](src/audio/audioLevels.json). Instrument corrections are applied once to decoded sample buffers; scenery corrections are applied to each player's gain, before the shared scenery slider. No loudness analysis runs during playback. Tests reject stale measurements when an audio asset changes, verify runtime gain application, and exercise the full mix through the master limiter.

Regenerate the recordings and calibration with:

```bash
npm run scenery:download
npm run audio:analyze
npm test
```

The analyzer also regenerates the original procedural scenery WAVs and builds the three-drop faucet sequence at its existing animated impact times, with a two-second duration so the last recorded drop can decay naturally. The download scripts never execute remote JavaScript. FFmpeg is a development-only dependency; it is not shipped to browsers.

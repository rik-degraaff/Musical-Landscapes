# FarmJam

A touch-first React/Vite music toy for small children. Instruments can be dragged around the landscape and tapped on/off. Tap the sun or moon to move to the next landscape: morning, midday, afternoon, dusk, night, and dawn. The celestial body follows an animated arc, with reduced-motion support. The music is generated from a library of hand-written one-bar patterns rather than generated note-by-note.

FarmJam suppresses in-page context menus, selection, native dragging, pinch zoom, and page scrolling while preserving multi-finger instrument playing. Browser chrome and operating-system gestures cannot be intercepted by a web app. The mixer remains scrollable with a mouse wheel.

Equipped and unequipped instruments use the same active playback state. Tap an instrument to toggle music, including while it is equipped. Playing its manual controls stops that instrument's automatic phrase; tap its drawing to resume. Equipping or putting down an active instrument preserves sounding notes, queued events, and the transport position. Putting down a playing instrument leaves it active.

All controls are ready to display phrase playback before music starts. Piano always shows C3-A5 (34 chromatic notes), marimba C5-A6 (22), and flute C4-C#6 (26); these bounded ranges cover all authored phrases in every scene key. Guitar chord buttons and voicings follow the scene key immediately; open strings retain standard tuning. Playback displays chord names where applicable, string/fret positions, note keys, drum pads, and wind controls. Brief hits fade over 420 ms.

Flute uses a standard concert-pitch Boehm B-foot fingering model, not note-selection presets. Hold the actual thumb, left/right finger, G-sharp, D-sharp, low-foot, and trill keys together. Valid combinations sound automatically; there is no breath button or strength slider. The Low/Middle/High selector represents the air-register change required for identical fingerings in different octaves, not a separate blowing gate. The model covers B3-C7 standard fingerings, includes thumb/lever/one-and-one B-flat alternatives and alternate F-sharp fingerings, and accounts for linked thumb and low-foot controls. Unsupported combinations are silent; extended techniques, multiphonics, and every possible alternate fingering are not simulated. Upper pitches beyond recorded samples use sample transposition. Fingering facts were checked against the [Woodwind Fingering Guide first](https://www.wfg.woodwind.org/flute/fl_bas_1.html), [second](https://www.wfg.woodwind.org/flute/fl_bas_2.html), and [third octave](https://www.wfg.woodwind.org/flute/fl_bas_3.html) charts; no chart artwork is bundled.

Trumpet has three valves and a captured-pointer embouchure area divided into six vertical strips (C4, G4, C5, E5, G5, C6 concert pitches). Holding the area blows; sliding left/right changes lip register without releasing, and motion within a strip adds a small continuous pitch bend. Lip slurs crossfade into the new sample's sustain region rather than replaying its attack. Release/cancel stops the breath. Autoplay visibly depresses valve buttons and shows the corresponding lip position with a subtle visual quiver, disabled for reduced motion. Physical flute keys likewise depress for the duration of autoplay notes.

Instruments avoid the sun or moon's resting hit area after its arc animation finishes, but do not dodge it as it passes across the sky.

Gameplay is landscape-only. The installed PWA declares landscape orientation, and the app requests a Screen Orientation lock. Browsers that require fullscreen can use the portrait-screen rotation button to request fullscreen and retry the lock. Some browsers, including iOS Safari, do not permit web apps to force device orientation; there the rotate-device guard blocks portrait gameplay until the device is turned.

## Run

```bash
npm install
npm run dev
```

Then open the Vite URL shown in the terminal.

## Install as an app

Deploy the production build to an HTTPS origin, then use the browser's install action (or Add to Home Screen on iOS). The app shell and bundled instrument/scenery audio are cached for offline use after the first successful load.

Installed copies check for deployed changes while online. The service worker installs the new build and reloads the app automatically; while offline, the last cached version remains available and updates when the app reconnects.

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
    LandscapeArt.jsx      Responsive illustrated backgrounds for all six worlds
    ObjectArt.jsx         Matching interactive object illustrations
    scene-art.css         Scene styling and object-specific animation
    FarmScene.jsx         Cow + tractor
    GardenScene.jsx       Outdoor faucet + bird
    PondScene.jsx         Frog + windmill
    NightScene.jsx        Bell + owl
    DawnScene.jsx         Rooster + wind chimes
    DuskScene.jsx         Cricket + propeller airplane
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
- **Drums**: recorded MuldjordKit kick, snare, closed hi-hat, high/floor toms, crash and ride, plus a CC0 hand clap. Shortened snare/hat recordings provide stylized rim/shaker accents, not separate rim or shaker recordings.
- **Trumpet**: sampled brass attacks and body rather than a saw oscillator.
- **Marimba**: sampled wooden bars with natural attack and decay.
- **Flute**: recorded flute tone, including its natural breath character.

The five pitched instruments use FluidR3 GM recordings distributed by MIDI.js Soundfonts. Each manual key, guitar string/chord tone and trumpet fingering has an exact-pitch recording in the playable range. Automatic phrases can repitch nearby recordings by at most two semitones. These are single-dynamic soundfont samples, not multi-velocity studio libraries. Manual trumpet/flute voices use cached sustain loops selected by waveform similarity and blended over 60 ms with a smooth crossfade; the attack is preserved and the loop seam follows adjacent waveform samples. This remains a sampled approximation of continuous breath, not a physical wind-instrument model.

All instrument recordings are bundled under `public/audio/instruments/`, so runtime playback has no sound-CDN dependency. The expanded exact-pitch bank takes longer to decode on first use. The Play screen waits for every sample and the reverb to be ready. Failed loads show a retry instead of enabling silent instruments. A short, restrained convolution reverb adds space to pitched instruments; the acoustic drums remain dry and all voices feed the master limiter.

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
- All six scenes have at least two interactive objects.
- Instrument volume settings are remembered when a muted instrument is switched back on.
- Opening the mixer requires two clicks or taps within 450 ms; a single click/tap still closes it. Keyboard users can activate the focused mixer button twice with Enter or Space.
- The mixer has one shared **Scenery sounds** slider for all non-instrument sounds, including a mute setting at -60 dB. Its setting persists across scenes and does not alter instrument levels.
- Instruments can be toggled from a keyboard as well as by touch or mouse; canceled drags are cleared without toggling. Scene, mixer and object controls use standard buttons.

## Scenes

## Manual Performance

Drag any instrument onto the child to equip it. A large playable version opens along the bottom, while the landscape, other instruments, scene sounds and mixer remain usable above it. The equipped instrument's automatic phrase pauses; other active parts continue. Drag the small equipped drawing away to end manual play, or use the return icon. An automatic part that was enabled resumes afterwards. Switching equipment, canceled pointers, window blur and hidden tabs release manual voices.

- **Piano**: 17 chromatic keys from C4 through E5, with simultaneous touch chords and press/release sustain.
- Manual piano key-up has a 900 ms exponential release instead of the short wind-note release. Unequipping, window blur and same-pointer retriggers use a separate quick fade.
- **Trumpet**: hold the breath control, combine the three valves, and select one of five harmonic registers. Valve intervals follow a concert-pitch trumpet's 2/1/3-semitone lowering, covering F#3 through G5 with alternate fingerings. This is not a transposing written-pitch notation system.
- **Guitar**: pluck any of six strings or sweep across them in either direction. Hold C, G, Am or F with another finger; releasing the chord control restores open E2/A2/D3/G3/B3/E4 strings. Muted chord strings do not sound.
- **Flute**: hold one of the chromatic C4–C5 keys to sustain its note; releasing it stops the breath.
- **Drums**: tap the corresponding kit piece: kick, snare, high tom, floor tom, hi-hat, crash, ride, rim, shaker or hand clap.
- **Marimba**: strike chromatic C5–C6 bars; their natural tails decay after release.

All play controls support simultaneous touch input. Focused note/valve/chord controls can also be held with Space or Enter. Focus a landscape instrument and press E to equip it without dragging. Guitar strings can be activated with Space or Enter. Dropped instruments slide away from other instruments, scene controls and objects; positions are rechecked when the scene or viewport changes.

Piano, guitar and marimba also respond to swipes that begin outside playable keys, bars or strings. Pointer paths are sampled between motion events, so fast sweeps play every crossed target in either direction. Piano notes release when the finger leaves their key or the keyboard; marimba and guitar strikes retain their natural tails. Mouse hover alone never plays a note. Each finger owns its own swipe, and canceling a gesture, switching equipment or leaving the window clears its held notes and highlights.

## Environments

1. **Sunny Farm** — cow and tractor
2. **Little Garden** — outdoor faucet and bird
3. **Pond Meadow** — frog and windmill
4. **Evening Meadow** — a setting sun, early stars and fireflies, a chirping cricket and a banking propeller airplane
5. **Sleepy Night** — bell and owl
6. **First Light** — a rising sun over misty fields, a recorded rooster crow and swaying wind chimes

The circular arrow control in the bottom-right rotates through the scenes. The illustrations include rolling fields, a flower garden, reflective pond water, and a moonlit woodland with fireflies. Scenery proportions adapt to portrait and landscape screens.

In Evening Meadow, tapping the cricket makes it hop and rub its wings with rhythmic chirps. Tapping the airplane triggers a short banking flyby, spinning propeller and a soft tapered engine sound. Both are original procedural effects rendered to local WAVs and calibrated through the same offline loudness analysis and shared scenery mixer as the other objects. Reduced-motion preferences apply to both interactions.

## Interactive objects

Each object has a distinct sound and a replayable response: the cow nods and moos, the tractor rattles with exhaust, the faucet makes three gentle drips with animated falling drops and impact ripples, the bird flies and chirps, the frog leaps and croaks with ripples, the windmill spins faster with airy wooden clacks, the bell swings and rings, and the owl blinks and hoots. Reduced-motion preferences are respected.

The faucet uses one shared audio/animation timeline: quiet drop impacts at 0.28, 0.93 and 1.58 seconds, with silence between them. Animation start time accounts for the browser audio-output clock. Repeated taps restart the faucet sequence instead of stacking multiple leaks. Other scenery sounds retain their overlapping tap voices.

The faucet now uses an actual recorded water drop rather than a synthesized plop; the sunrise rooster is also a real recording. Both are CC0, bundled locally, and credited in [Scenery Attribution](public/audio/scenery/ATTRIBUTION.md). Other object sounds are original procedural effects rendered to local WAV assets offline. No sound CDN is used during playback. Samples have tapered endpoints; the master limiter also covers scene sounds.

## Measured Default Balance

Every playback asset is decoded and analyzed offline using FFmpeg: integrated EBU R128/BS.1770 loudness (LUFS), full-waveform RMS, gated active RMS, and true/sample peak. Silence is excluded from the active RMS calculation using 50 ms blocks within 20 dB of the loudest block. Gated active RMS is the fallback for clips too short to yield finite integrated LUFS.

The analyzer precalculates a gain toward -20 LUFS for instrument recordings, -23 LUFS for scenery, and a deliberately quieter -26 LUFS target for dripping water. Corrections are bounded to -24 through +18 dB and constrained by a -5 dBFS true/sample-peak ceiling. Transient-heavy samples may remain below the loudness target to preserve their peaks; this is linear gain, not compression. The instrument mixer defaults and authored note velocities then retain the musical foreground/accompaniment balance.

The complete measurements, asset SHA-256 hashes and gains are committed in [audioLevels.json](src/audio/audioLevels.json). Instrument corrections are applied once to decoded sample buffers; scenery corrections are applied to each player's gain, before the shared scenery slider. No loudness analysis runs during playback. Tests reject stale measurements when an audio asset changes, verify runtime gain application, and exercise the full mix through the master limiter.

Regenerate the recordings and calibration with:

```bash
npm run scenery:download
npm run audio:analyze
npm test
```

To add measurements for new recordings without replacing existing gain choices, run `npm run audio:analyze -- --preserve-existing`. Gains are retained only when the asset hash is unchanged.

The analyzer also regenerates the original procedural scenery WAVs and builds the three-drop faucet sequence at its existing animated impact times, with a two-second duration so the last recorded drop can decay naturally. The download scripts never execute remote JavaScript. FFmpeg is a development-only dependency; it is not shipped to browsers.

# FarmJam

A touch-first React/Vite music toy for small children. Instruments can be dragged around the landscape and tapped on/off. Tap the sun or moon to move through the seven-stop day/night cycle: farm, garden, pond, dusk, two moonlit scenes, and dawn. The sun and moon follow their arc, with the first moon left of center and the second farther right. The keys follow A major, E major, A major, C-sharp minor, A minor, F minor, and D-flat major before returning to A major. The music is generated from a library of hand-written one-bar patterns rather than generated note-by-note.

Play requires a selected child whose setup has been completed. The start menu shows every saved child's avatar and name as a radio selection, plus an **Add child** button. With no completed child selected, **Tap to play** is disabled. Adding a child requires the full eleven-step parent/caregiver setup below; installation itself remains optional.

The default six are piano, drums, ukulele, trumpet, marimba, and pan flute. Settings > Instruments has six slot selectors drawn from an eight-instrument catalog: guitar and concert flute remain available as alternatives. Selections persist locally; choosing an instrument already in another slot swaps the two rather than duplicating it. Removing an active or equipped instrument stops its voices and closes its performance surface safely.

FarmJam suppresses gameplay pinch zoom and page scrolling while preserving multi-finger instrument playing. The child menu, caregiver setup and Settings permit browser zoom; caregiver dialogs remain scrollable. In-page context menus, selection and native dragging are suppressed. Browser chrome and operating-system gestures cannot be intercepted by a web app.

Equipped and unequipped instruments use the same active playback state. Tap an instrument to toggle music, including while it is equipped. Playing its manual controls stops that instrument's automatic phrase; tap its drawing to resume. Equipping or putting down an active instrument preserves sounding notes, queued events, and the transport position. Putting down a playing instrument leaves it active.

The manual panel's instrument name, current notes, and put-down control sit below the playable surface, leaving a bottom-edge buffer that includes the device safe-area inset. Guitar sits slightly higher, and piano and marimba use longer keys within the same panel height.

A compact mechanical metronome stays at the bottom left, moving above the performance panel when an instrument is equipped. Tap it to enlarge the metronome itself, without a surrounding panel. Drag the weight up for slower tempo or down for faster tempo (40-208 BPM, initially 92). Holding the weight pauses the shared transport and mutes instrument output without changing active states; release or touch cancellation resumes at the new global tempo. The weight supports arrow keys and Home/End as well. A physical sliding switch mounted on the metronome's base enables beat clicks, accented every fourth beat. After audio starts, the clock and pendulum keep going whether sound is off, all instruments are off, or the metronome is enlarged. Only actively adjusting tempo pauses them. Tempo changes use musical-tick event positions so queued phrases remain beat-aligned.

Tapping outside either the expanded metronome or hamburger settings dismisses it; the dismissal tap does not trigger the control underneath. Escape also closes either menu. Metronome sound continues independently after its menu closes.

All controls are ready to display phrase playback before music starts. Piano now shows C4-F#5 (19 chromatic notes rather than 34), marimba C5-A6 (22), pan flute C4-A5 (22 pipes), and optional concert flute has its complete physical key layout. Compact piano phrases use close inversions and octave-cyclic transposition that preserves pitch classes while fitting every key in the same 19-note range, allowing wider keys. Guitar and ukulele chords follow the scene key immediately; open strings retain standard tuning. Orange filled fret markers, orange open-string rings, and strong orange piano note highlights remain visible without enabling advanced diagrams. Brief hits fade over 420 ms.

Guitar and ukulele offer all seven diatonic triads and their diatonic seventh chords in the current major key (14 chords, including diminished and half-diminished shapes). Every chord uses every string at an in-key, sounding fret, with no muted strings; voicings may be inversions and stay within four frets. Guitar uses E2/A2/D3/G3/B3/E4 tuning; ukulele uses re-entrant G4/C4/E4/A4 tuning. Chord buttons overlay the neck; strum on the soundhole side. Fingering charts are off by default, but high-contrast orange fret markers are always shown. Optional diagrams use filled circles for frets and hollow circles for open strings. Shapes are ordered by average physical finger distance from the soundhole, with closer shapes first.

Double-tap the hamburger menu to open the colorful settings modal. Sound has illustrated instrument/scenery volume controls. Instruments contains the six slot selectors and one selected instrument's equipped complexity, with green Simple, blue Standard, and coral Advanced choices. Display details are collapsed under that same instrument: optional note/control labels, playback note names, and chord fingering charts. There are no separate global presets, Playback tab, or Display tab. Settings persist locally, including migration of old percentage values into the three levels, and individual changes do not reset other instruments. The modal supports keyboard tabs, focus trapping, Escape, and outside-click dismissal.

Difficulty applies only while that instrument is equipped; unequipped accompaniment retains its normal noise-selected phrases. Every key has at least two distinct Simple phrases and two additional Standard phrases per instrument. Tier selection considers action count and subdivisions as well as pitches and available controls. Simple guitar/ukulele exposes the I, IV, and V triads; Standard exposes six major/minor triads, omitting the diminished chord; Advanced retains all fourteen triad/seventh choices. Every enabled phrase maps to an available chord and playable string positions. Other instruments similarly reduce where possible: narrower piano/marimba ranges, fewer pan pipes and drum pads, and fewer flute/trumpet registers. Key changes can adjust low-complexity wind and pan-flute octaves to keep the same simple material within that tier's range. Advanced is the new-install default and preserves the full controls; concert flute retains the physical key mechanism while reducing register choices at lower levels.

The Next phrase icon beside the put-down control cycles the equipped instrument to another compatible phrase, leaving the accompaniment and metronome on the same shared timeline. It starts automatic playback if needed and joins the chosen phrase on the next downbeat (with the existing pickup behavior when restarting a stopped part). Explicitly selected phrases repeat until another skip, key/difficulty change, or equipment change; otherwise equipped phrase selection evolves normally. Changing equipped difficulty clears incompatible queued notes, and all detailed playing markers remain orange without enabling diagrams.

The left two-thirds of the guitar shows all 24 frets with proportionate spacing; the soundhole is on the right. The selected or playing chord is superimposed translucently on the neck; optional fret positions show its full fingering circles and brighter dots for the phrase's sounding notes. Numeric fret inputs and per-string fret-number labels are removed. Every authored guitar and ukulele event is assigned a chord for each key before playback: chord candidates must contain the source pitch classes, and neighboring events help disambiguate single-note passages. This contextual choice is not a claim that a single note uniquely identifies a chord. All playback events, including difficulty chord substitutes, are revoiced to the active chord's canonical string positions. Sounding notes, string indices and frets use that exact mapping, not arbitrary octave-equivalent note positions. Audio scheduling, manual playing and practice guidance share those canonical chord notes and frets.

Flute uses a standard concert-pitch Boehm B-foot fingering model, not note-selection presets. Hold the actual thumb, left/right finger, G-sharp, D-sharp, low-foot, and trill keys together. Valid combinations sound automatically; there is no breath button or strength slider. Pitch register is integrated into the headjoint: tap or slide toward its upper position for higher notes and lower position for lower notes. This is not a blowing gate; it represents the air-direction/register distinction required when identical fingerings produce different octaves (for example G4/G5). Autoplay shows its register position. Arrow Up/Down and Home/End also select the register. Register labels are available through the instrument's display settings rather than a detached button row. The model covers B3-C7 standard fingerings, includes thumb/lever/one-and-one B-flat alternatives and alternate F-sharp fingerings, and accounts for linked thumb and low-foot controls. Unsupported combinations are silent; extended techniques, multiphonics, and every possible alternate fingering are not simulated. Upper pitches beyond recorded samples use sample transposition. Fingering facts were checked against the [Woodwind Fingering Guide first](https://www.wfg.woodwind.org/flute/fl_bas_1.html), [second](https://www.wfg.woodwind.org/flute/fl_bas_2.html), and [third octave](https://www.wfg.woodwind.org/flute/fl_bas_3.html) charts; no chart artwork is bundled.

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

Installed copies check for deployed changes while online. A complete new build waits while sounds load, play is active, child setup is open, or changes could not be saved. It activates and reloads at the child menu once those conditions clear. While offline, the last successfully cached build remains available. Failed saves leave choices usable in the current session and show a caregiver warning with a retry control; device storage is not a permanent backup.

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

The browser suite starts Vite locally. It measures actual Web Audio waveforms for the instruments and scene objects, decodes all bundled recordings, tests failed-load retry, verifies saved gain corrections and full-mix headroom, exercises rapid toggles and repeated taps, checks dragging, cancellation, keyboard control, audio suspension recovery, mixer persistence and reduced motion, and captures each landscape at desktop, portrait phone and compact landscape sizes. Screenshots and failure traces go into the ignored `test-results/` directory.

Run `npm run test:e2e:release` for the complete desktop/compact-touch gate and `npm run test:production` for a fresh build plus actual service-worker offline, interrupted-install and deferred-update checks. See [release validation](docs/release-validation.md), [the executed engineering roadmap](docs/engineering-roadmap.md) and [potential feature ideas](docs/feature-ideas.md). The proposals are documented only, not implemented.

The focused [scene-composition test](e2e/scene-composition.spec.js) covers all 28 regular and visitor objects across seven scenes using regular, frequent and rare rolls at 1440x900, 1024x768, 852x393, 780x284 and 640x360. It captures unequipped object details and whole-scene screenshots both unequipped and with piano equipped. Checks cover viewport bounds, sensible sizes, ground/water/sky habitat thresholds, object-to-object overlap, equipped-instrument/settings clearance, reachable object centers and instrument clearance from the settled sun or moon. Screenshots support visual habitat review; the numeric thresholds alone do not prove exact contact with a branch or bank. Run this slice with `npm run test:e2e -- e2e/scene-composition.spec.js --project=desktop`. This describes coverage, not a claim that the full suite has passed.

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
    StartScreen.jsx       Mandatory child selection and audio-unlock screen
    NoteParticles.jsx     Reusable particle component
  scenes/
    Scene.jsx             Scene registry and rotation control
    LandscapeArt.jsx      Responsive illustrated backgrounds for all seven stops
    ObjectArt.jsx         Matching interactive object illustrations
    scene-art.css         Scene styling and object-specific animation
    object-placement.css  Per-object habitat anchors and responsive sizes
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

Changing the landscape changes both the tonic and mode: Morning (Sunny Farm) **A major**, Midday (Little Garden) **E major**, Afternoon (Pond Meadow) **A major**, Dusk **C-sharp minor**, Early Night **A minor**, Late Night **F minor**, Pre-Dawn (First Light) **D-flat major**, then back to Morning and Midday. Minor scenes use natural-minor melodies and diatonic minor chord libraries, not major phrases with a different root label. D-flat is displayed in chord labels; internal sampler pitches use its enharmonic C-sharp spelling. Marimba and pan-flute pitches fold by octave inside their existing fixed note banks, retaining each transposed pitch class. Percussion labels are kept intact during transposition.

## Instrument sounds

All six instruments now play recorded samples through Tone.js Sampler instead of custom oscillator synthesis:

- **Piano**: sampled acoustic grand piano with natural hammer attacks and resonant decays.
- **Acoustic guitar**: nylon-string recordings, new fingerpicked phrases and chord voicings; chord notes are staggered by 16 ms for a gentle strum. This replaces the former bass instrument.
- **Drums**: recorded MuldjordKit kick, snare, closed hi-hat, high/floor toms, crash and ride, plus a CC0 hand clap. Shortened snare/hat recordings provide stylized rim/shaker accents, not separate rim or shaker recordings.
- **Trumpet**: sampled brass attacks and body rather than a saw oscillator.
- **Marimba**: sampled wooden bars with natural attack and decay.
- **Flute**: recorded flute tone, including its natural breath character.

Piano, guitar, trumpet, marimba, flute and pan flute use FluidR3 GM recordings distributed by MIDI.js Soundfonts. Ukulele uses genuine Flight Fireball tenor ukulele recordings by Mateusz Dąbrowski from FreePats, licensed CC0, not repurposed guitar audio. Thirteen selected ukulele root recordings are bundled unchanged as FLAC; nearby pitches are resampled, and pitches above C6 are transposed from the top root. Pan flute has 22 chromatic FluidR3 `pan_flute` recordings C4-A5. New phrases include gentle uke strums, re-entrant picking and lyrical pan-pipe motifs. Samples and their measured calibration are bundled locally. These are sampled instruments, not multi-velocity physical models. Manual trumpet/flute/pan-flute voices use cached sustain loops selected by waveform similarity and blended over 60 ms; the attack is preserved and the loop seam follows adjacent waveform samples.

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
- With all instruments off, the transport keeps running for the silent metronome; instruments rejoin the ongoing musical timeline when enabled.
- Interactive scene sounds respond immediately, independently of the musical transport. Three voices per object support overlapping taps without cutting off other objects.
- Audio unlock begins inside the Play gesture, and subsequent instrument/object gestures resume audio after a browser suspension.
- Backgrounding, page hiding, or an audio-context interruption stops the transport, clears pending notes and UI cues, and releases held manual inputs and sounding samples. On return, active instruments and the metronome restart together at a fresh downbeat rather than trying to replay missed callbacks. Instrument selections, active states, tempo, and sound settings are retained. If the browser requires a gesture to resume audio, the next tap/key press retries recovery.
- Trumpet lip and valve ownership is cleared on blur, backgrounding, and audio interruption. Window-level pointer release/cancel and mouse-button-loss handling prevent missed local releases from leaving an indefinitely looping wind voice.
- Bar downbeats use the transport callback's audio timestamp directly; later notes use transport positions. Drum labels map to explicit sampler pitches and hit-specific durations.
- All seven landscapes have at least two interactive objects.
- Instrument volume settings are remembered when a muted instrument is switched back on.
- Opening the mixer requires two clicks or taps within 450 ms; a single click/tap still closes it. Keyboard users can activate the focused mixer button twice with Enter or Space.
- The mixer has one shared **Scenery sounds** slider for all non-instrument sounds, including a mute setting at -60 dB. Its setting persists across scenes and does not alter instrument levels.
- Instruments can be toggled from a keyboard as well as by touch or mouse; canceled drags are cleared without toggling. Scene, mixer and object controls use standard buttons.

Manual pitched voices use native buffer sources, tracked after release in `retiringVoices` until `source.onended` disconnects them; hard stops also shorten already-fading tails. Cleanup attempts `source.stop()` in `finally`, even when envelope automation is unsupported or throws. A scene-key change clears every instrument's pending events, releases sampler and manual notes, discards queued manual wake notes, and resets gesture ownership. Other context changes use the relevant instrument/input scope, not a global clear on every piano press: same-owner pitch replacement preserves unrelated piano touches and multitouch chords. Pitched sampler note-set changes release the previous set before replacement attacks at the scheduled timestamp; drums bypass this replacement rule so cymbal tails can overlap. Guitar/ukulele chord changes stop strings from the previous shape. Swipe input resets clear pointer ownership, and mouse movement with no button held ends the held swipe.

## Scenes

Each scene entry makes one random roll: exactly **25%** selects the first visitor below, **5%** selects the second, and **70%** keeps the regular pair. These outcomes are mutually exclusive. A visitor replaces one of the scene's two existing interactive objects, never adds a third, so there are always exactly two objects in total. The chosen pair stays stable across taps, opening or changing Settings, and rerenders. Every landscape transition, including returning to a previously visited scene, makes a fresh roll. Entering gameplay from the child menu also rolls anew instead of reusing the menu's background pair. A fresh roll can select the same pair again.

| Scene | First visitor (25%) | Second visitor (5%) |
| --- | --- | --- |
| Farm (Sunny Farm) | Sheep | Horse |
| Garden (Little Garden) | Bumblebee | Woodpecker |
| Pond (Pond Meadow) | Duck | Otter |
| Dusk (Evening Meadow) | Cicada | Hot-air balloon |
| Night (Sleepy Night) | Fox | Badger |
| Late night (Moonlit Meadow) | Luna moth | Shooting star |
| Dawn (First Light) | Dove | Deer |

The usual regular objects listed under **Environments** remain the default, with their existing sounds and tap responses; a visitor changes only its replacement slot for that visit. Visitors have matching illustrations, tap animations and sound effects. Sheep, horse, duck, fox and dove use real **CC0 1.0 recordings**. The other nine visitors use original illustrative foley matched to their actions, not recorded wildlife: bumblebee wing buzz, woodpecker knocks, otter splashes, cicada rasp, hot-air balloon burner air, badger leaf scuffs and sniffs, luna moth flutter, an imaginary shooting-star whistle and shimmer, and deer hoof impacts and a snort. Detailed recording sources, creators, licenses, excerpt processing and original foley descriptions are in [Scenery Attribution](public/audio/scenery/ATTRIBUTION.md#visitor-recordings).

## Manual Performance

Drag any instrument onto the child to equip it. A large playable version opens along the bottom, while the landscape, other instruments, scene sounds and settings remain usable above it. Active playback continues uninterrupted when equipping or putting down an instrument. Interacting with manual controls stops only that instrument's automatic phrase; tap its small drawing to resume. Drag the drawing away to end manual play, or use the return icon. Switching equipment, canceled pointers, window blur and hidden tabs release manual voices.

- **Piano**: 19 chromatic keys from C4 through F#5, with simultaneous touch chords and press/release sustain.
- Manual piano key-up has a 900 ms exponential release instead of the short wind-note release. Unequipping, window blur and same-pointer retriggers use a separate quick fade.
- **Trumpet**: hold and slide across six lip-register segments, combining the three valves for concert-pitch notes. The lip area occupies 40% of the play surface; the shortened trumpet illustration sits to its right, with wide valve targets across 46% of the surface. Lip slurs and fine pitch bends remain available. This is not a transposing written-pitch notation system.
- **Ukulele (default)**: pluck or strum four re-entrant G4/C4/E4/A4 strings. All chord strings sound, with orange fret markers and optional diagrams. The shorter neck has 18 frets.
- **Pan flute (default)**: hold a pipe or swipe across the chromatic C4-A5 pipe bank. It is monophonic, sustains while held and releases when the pointer leaves. Autoplay lights the sounding pipe.
- **Guitar (optional)**: pluck or strum six E2/A2/D3/G3/B3/E4 strings. Every chord string sounds; orange fret positions are always visible and fingering diagrams remain optional.
- **Flute**: hold standard Boehm physical-key combinations to sound notes automatically, with no breath button or strength slider. The headjoint is on the left, followed by left-hand and right-hand key groups along the tube. Thumb keys sit below the left-hand group, trill levers are offset above the body, and the low rollers and gizmo cluster around the footjoint on the right. A pitch-position control built into the headjoint selects the register needed for repeated fingerings.
- **Drums**: tap the corresponding kit piece: kick, snare, high tom, floor tom, hi-hat, crash, ride, rim, shaker or hand clap.
- **Marimba**: strike chromatic C5–A6 bars; their natural tails decay after release.

All play controls support simultaneous touch input. Focused note/valve/chord controls can also be held with Space or Enter. Focus a landscape instrument and press E to equip it without dragging. Guitar strings can be activated with Space or Enter. Dropped instruments slide away from other instruments, scene controls and objects; positions are rechecked when the scene or viewport changes.

Piano, guitar and marimba also respond to swipes that begin outside playable keys, bars or strings. Pointer paths are sampled between motion events, so fast sweeps play every crossed target in either direction. Piano notes release when the finger leaves their key or the keyboard; marimba and guitar strikes retain their natural tails. Mouse hover alone never plays a note. Each finger owns its own swipe, and canceling a gesture, switching equipment or leaving the window clears its held notes and highlights.

## Practice Room

Correct and incorrect practice inputs create independent green check or coral retry indicators near the played control. Each stays visible while floating upward and fading over 2.6 seconds, so rapid notes can show several outcomes together instead of replacing the previous visual response. Indicators never intercept taps, clear on practice reset, and use a stationary fade with reduced motion enabled. The status message remains available for screen readers.

Double-tap the selected child's avatar or the instrument they are holding to enter the full-viewport practice room inside the farm. Entry preserves the playback state from before the first tap; a single tap still toggles the equipped instrument's playback. An equipped instrument is selected initially; otherwise practice starts with the first landscape instrument. Keyboard users can focus the avatar and press Enter or Space. All eight instruments are available in the instrument selector, with phrases filtered to the instrument's saved difficulty and the current scene key. Practice always shows note/control labels and string fingering charts.

Practice has four stages:

1. **Listen** gives a four-beat count-in, then plays and repeats the selected phrase with live highlights. Next becomes enabled after one complete loop.
2. **Learn** highlights each complete note or grouped chord and waits until all of its notes are played correctly. Incorrect input can be corrected on every step, including after the first step. Next becomes enabled when the entire phrase is completed.
3. **Rhythm** gives a four-beat count-in, then repeats the selected phrase with live highlights and scoring. Correct pitches are accepted within 0.42 beats. Next becomes enabled after a correct performance of the entire phrase in this timed stage.
4. **Together** repeats the timed exercise with two quieter accompaniment instruments, rotating each through different phrases every bar. The selected instrument's phrase stays fixed and is never automatically played for you. Finish becomes enabled after a correct performance of the entire phrase in this stage.

Orange duration bars on the phrase track and playable controls shrink to show the remaining note hold time. Switch instruments, phrases, or stages at any time. Ready/Repeat and Restart controls have their own row above the playable surface on small screens; the practice metronome is in the header, not at the landscape's bottom-left position. Timed attempts can be stopped or restarted; the open door or Escape returns to the landscape. Backgrounding or losing focus pauses practice and clears held inputs. Leaving restores the farm's active parts, equipment, pinned phrase, tempo, and metronome sound, restarting on a fresh shared downbeat. String guidance uses the highlighted chord's exact canonical notes, strings and frets; a different held chord still sounds its own canonical notes.

## Parent/Caregiver Setup

The start menu's **Add child** button opens the mandatory eleven-step guide. Complete every step and use the final **Add child** action to save the child and select them for play. Canceling setup, closing it, or pressing Escape discards the draft without creating a child or changing existing children, their selection, or their settings. Choosing **Use these settings** only updates the draft; nothing is saved until completion succeeds.

1. **Welcome** introduces shared musical play and explains that the child's name, avatar and setup answers stay in this browser on this device.
2. **Install FarmJam** separates optional installation from **Keep your child in the app**, with instructions tailored to the detected OS and browser. Installation adds an icon and, where supported, a separate app window; it does not prevent exiting. Restricted play means keeping the child inside the app, not pinning an icon to a taskbar or Dock. Browser play remains available, and a bookmark is an alternative when installation is unavailable. Official installation links and device/browser Google-search fallbacks are provided; restriction guidance remains visible when the app is already installed.
3. **Your familiarity** asks about the adult's comfort with music before later explanations, which adapt their vocabulary to that answer.
4. **Your child** requires a nonblank name or nickname of at most 40 characters and asks for an age band: Under 3, 3-4, 5-7 or 8+. No birthdate is requested.
5. **Your avatar**, immediately after the age step, shows a live preview sized by the chosen age band. Choose short, bob, curls, ponytail, long curly or long straight hair; T-shirt, sweater, overalls, hoodie or cardigan tops; and trousers, shorts, skirt, joggers or leggings bottoms. Eight freely selectable shades each cover skin tone, hair and eyes, including light golden and warm brown skin tones. All four clothing color channels share the same 20-color palette; **Match top colors** copies both top colors to the bottoms. Existing saved styles and colors remain supported.
6. **Music experience** asks about the child's musical experience, then conditionally shows an instrument checklist when some experience or familiarity is selected.
7. **Recommended setup** suggests Simple or Standard. The adult can override it with Simple, Standard or Advanced for all instruments in the child's saved settings; the current six instrument choices stay unchanged. These settings are not applied to an existing child while the guide is open.
8. **Instruments** explains playback toggles, equipping and manual playing.
9. **Landscapes and sound** explains the key cycle, landscape metronome and sound settings. Double-tap the top-right Settings button to change instruments, per-instrument difficulty, labels and sound levels later.
10. **Practice room** explains Listen, Learn, Rhythm and Together, duration hints and completion controls.
11. **Play together** offers ideas for shared play and taking musical exploration off-screen, followed by the final **Add child** action.

The selected child's age-sized avatar appears in both the landscape game and practice room. Each child has an independent saved profile and instrument settings, including instrument choices, per-instrument difficulty and display details. Selecting a child loads that child's settings; later changes to those settings are saved for that child without changing the others. Newly added children start selected, and the selected child is persisted locally and restored when the app is reopened.

Use **Main menu** at the bottom of Settings to return to child selection. It stops all audio, clears equipment and held inputs, and preserves saved children and their settings. Starting play again creates a fresh audio session.

Child names or nicknames, age bands, avatars, setup answers and per-child settings are stored locally in this browser on this device. Names are stored, so these profiles are not non-identifying. There is no account or server-side child profile, and none of this child data is sent to a server. The guide can be scrolled by touch on short screens. Installation is optional, and saved children and settings may not carry over when switching browsers or app contexts.

Restricted play must be configured by a parent on the device; FarmJam cannot enable confinement. On iPhone/iPad, use [Apple Guided Access](https://support.apple.com/en-us/111795): enable it in Settings > Accessibility, privately set a parent-only passcode and optional Face ID/Touch ID, open the installed FarmJam app, triple-press the model's side/top/Home button and Start. To end, press the same button and authenticate privately, then End; Apple's current guide notes a double-press on iOS/iPadOS 18 or earlier. On Android, enable [app screen pinning](https://support.google.com/android/answer/9455138) in Security or Security & privacy settings (search Settings if needed), require the parent's PIN/pattern/password before unpinning, then open FarmJam > Overview > app icon > Pin. Unpin gestures depend on navigation mode; unlock privately and test that leaving requires authentication. Pinning a browser shortcut may pin the browser rather than confine play to FarmJam.

On Windows, [Assigned Access](https://learn.microsoft.com/en-us/windows/configuration/assigned-access/overview) depends on Windows version and edition (not Home); single-app kiosks support Edge or a supported Windows app, not an arbitrary Chrome PWA. A parent/administrator must configure and test a separate kiosk account. macOS has no iOS Guided Access; Linux kiosk setup varies by distribution and desktop. The guide provides OS-specific Google searches for an app kiosk and restricted child account where exact instructions are uncertain. A restricted account alone, fullscreen, or a taskbar/Dock shortcut is not a single-app lock. Keep parent unlock details private and test the exit controls before handing over the device.

## Environments

1. **Sunny Farm** — cow and tractor
2. **Little Garden** — outdoor faucet and bird
3. **Pond Meadow** — frog and windmill
4. **Evening Meadow** — a setting sun, early stars and fireflies, a chirping cricket and a banking propeller airplane
5. **Sleepy Night** — the first moonrise, with bell and owl
6. **Moonlit Meadow** — a distinct late-night willow grove, silver stream and moonflowers, with a fluttering bat and rustling hedgehog
7. **First Light** — pale, cold pre-dawn light over blue-grey misty fields, a recorded rooster crow and swaying wind chimes

The circular arrow control in the bottom-right rotates through the scenes. The illustrations include rolling fields, a flower garden, reflective pond water, and a moonlit woodland with fireflies. Scenery proportions adapt to portrait and landscape screens.

In Evening Meadow, tapping the cricket makes it hop and rub its wings to a real CC0 cricket recording. The farm cow also plays a real CC0 moo recording. Source credits and reproducible processing commands are in [the scenery attribution file](public/audio/scenery/ATTRIBUTION.md). The airplane triggers a short banking flyby, spinning propeller and a soft tapered engine sound. Late-night bat wings and hedgehog footsteps have distinct original foley rendered to local WAVs. All effects use offline loudness analysis and the shared scenery mixer; reduced-motion preferences apply to their visual reactions.

## Interactive objects

Placement follows each object's identity, not the location of the slot it replaces. [Scene.jsx](src/scenes/Scene.jsx) imports [object-placement.css](src/scenes/object-placement.css) after the animation styles; its anchors align objects with the scenery in [LandscapeArt.jsx](src/scenes/LandscapeArt.jsx). Cow, sheep, horse and tractor occupy the farm ground/pasture; faucet stands on garden ground; rooster, cricket, cicada, hedgehog, fox, badger and deer stay on dry ground. Bird, owl and dove perch by tree branches, bell and chimes hang by branches, woodpecker has a rooted stump, and bees hover at the flowerbed. Duck and otter swim in the pond, frog sits on the dry left bank, and windmill stands on the right bank. Airplane, bat, balloon, luna moth and shooting star use sky anchors.

Standard object widths use `clamp(76px, min(13.4vh, 12vw), 120px)`, with height at 87.5% of width. Windmill is square at 90-160px; tractor is 84-145px; airplane is 76-128px. Horizontal bounds retain a 4px inset. Short landscapes adjust branch, stump, windmill and bat positions; opening a manual instrument preserves object sizes and shifts the duck from 53% to 62% across the scene to clear the held instrument. The pond bank artwork remains a small supporting detail rather than a replacement for per-object anchors.

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

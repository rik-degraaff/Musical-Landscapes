# Musical and instrument reference

For setup, profiles, caregiver settings, guides, and learning hints, see [the caregiver guide](caregiver-guide.md). This reference focuses on music, instruments, scenes, and audio behavior.

## Musical system

Landscape playback selects whole authored four- or eight-bar chord progressions through weighted Markov transitions. The original motifs in `src/data/compositionPhrases.js` remain shared source material for Folk, Jazz and Rock; each style layers its own extra phrases, family maps, weights, and movement shapes over that base. Random draws select progression and motif states, not individual notes; deterministic voice leading renders chord-relative contours within playable ranges and canonical string voicings.

Tap one of the sky clouds to change the music weather. Cloud taps cycle Folk → Jazz → Rock → Folk. Sparse, pale clouds indicate Folk; a denser blue-gray cloud bank indicates Jazz; warm peach clouds indicate Rock. The same cloud forms keep their sky positions as landscapes rotate. Style changes begin at the next downbeat and blend their movement, harmony, motif, rhythm, ensemble-coordination, and voicing constraints over eight bars. Each movement selects a shape-dependent set of ideas, then schedules those families in long, overlapping phases instead of making every idea available all the time. Its next movement is planned before the handoff; tension, idea weights, and melodic anchors crossfade into it. A movement-level similarity value biases melody parts toward a shared contour or anchor, while the accompaniment pair can rotate slowly at movement boundaries. Small deterministic noise and bounded chord-tone/register variations add motion without leaving playable harmony. Style and movement definitions live separately from the bar renderer so additional genres can supply their own progressions, movement shapes, motif families, and numerical rules.

At most two active instruments from piano, guitar and ukulele supply chordal accompaniment; other pitched parts play melodies and drums supply percussion. The pair stays stable within a movement, then may rotate gradually at the planned handoff. Equipping alone does not displace active accompaniment. Only the equipped instrument's saved tier restricts its motif pool and controls; unequipped parts use Advanced. The shared progression is filtered to remain playable for the planned parts, so equipped tier restrictions can also limit its harmony. These are structural constraints, not measured musical-quality scores.

Changing the landscape changes both the tonic and mode: Morning (Sunny Farm) **A major**, Midday (Little Garden) **E major**, Afternoon (Pond Meadow) **A major**, Dusk **C-sharp minor**, Early Night **A minor**, Late Night **F minor**, Pre-Dawn (First Light) **D-flat major**, then back to Morning and Midday. Minor scenes use natural-minor harmony and diatonic minor chord libraries, not major phrases with a different root label. D-flat major and F minor use flat chord labels; internal sampler pitches retain sharp enharmonic spellings. Generated notes fit the instruments' playable banks; authored practice phrases retain octave folding for marimba and pan flute. Percussion labels remain unchanged.

## Instrument sounds

Rock uses the existing acoustic samples with straight eighths, a kick/snare backbeat on alternating quarter beats, soft hi-hat offbeats and occasional small tom turns. Nine tiered authored motifs add bouncy chord strums and repeating sing-along hooks; repeated contours keep their exact pitches. Verse/chorus and sing-along movement shapes favor shared melodic ideas, modest register variation and familiar I–V–IV–I / I–V–vi–IV progressions (diatonic equivalents in minor scenes). Simple parts keep four or fewer quarter-beat events. Rock tone gently rounds the acoustic samples and shortens their gates, with bounded accents and the existing .72 velocity ceiling. It adds no distortion or mixer gain. Its motifs also enter the existing phrase selector and composition-derived practice pool.

Jazz adds `brassCall` (Simple and above) and `brassRiff` (Standard and above): authored repeated chord tones, modest alternating accents, short gaps and a resolving answer. Trumpet is more likely to select them than the softer winds. Repeated contours retain their exact pitch through deterministic voicing; they do not gain random chromatic dissonance. Jazz eighth-note offbeats are delayed by .16 beats. Folk retains its straight pulse, open strums and lyrical phrases.

Style data supplies per-instrument tone cutoff, note gate and accent depth. A gentle high-frequency shelf attenuates by up to 4 dB above its cutoff; it never boosts frequencies. Jazz gives trumpet a gently brighter edge and shorter articulation, with rounder piano/string comping and slightly more defined marimba/wind phrases. Folk stays close to the original open acoustic sound, with a softer trumpet. No distortion, resonance boost or extra mixer gain is added; authored velocities remain capped at .72. These are gentle phrasing/colour choices for young children, not harsh brass effects.

The movement planner derives a stable per-instrument colour from its seed: cutoff varies by at most 3.5%, gate/accent by at most 2.5%, well below the genre differences. Colours crossfade at movement handoffs, and style settings interpolate throughout the existing eight-bar genre transition. `plan.movement.performance` exposes the applied settings; each event carries its gate so playback, autoplay cues and composition-derived practice durations agree. Tone filters affect both manual and sampled voices, while manual hold/release ownership stays unchanged. Bar-time automation ramps for 120 ms, is replaced on lookahead replans, and is canceled with pending playback. Drums retain their dry sampled signal path.

All eight instruments play recorded samples through Tone.js Sampler:

- **Piano**: sampled acoustic grand piano with natural hammer attacks and resonant decays.
- **Acoustic guitar**: nylon-string recordings, fingerpicked phrases and chord voicings; chord notes are staggered by 16 ms for a gentle strum.
- **Drums**: recorded MuldjordKit kick, snare, closed hi-hat, high/floor toms, crash and ride, plus a CC0 hand clap. Shortened snare/hat recordings provide stylized rim/shaker accents, not separate rim or shaker recordings.
- **Trumpet**: sampled brass attacks and body rather than a saw oscillator.
- **Marimba**: sampled wooden bars with natural attack and decay.
- **Flute**: recorded flute tone, including its natural breath character.

Piano, guitar, trumpet, marimba, flute and pan flute use FluidR3 GM recordings distributed by MIDI.js Soundfonts. Ukulele uses genuine Flight Fireball tenor ukulele recordings by Mateusz Dąbrowski from FreePats, licensed CC0, not repurposed guitar audio. Thirteen selected ukulele root recordings are bundled unchanged as FLAC; nearby pitches are resampled, and pitches above C6 are transposed from the top root. Pan flute has 22 chromatic FluidR3 `pan_flute` recordings C4-A5. New phrases include gentle uke strums, re-entrant picking and lyrical pan-pipe motifs. Samples and their measured calibration are bundled locally. These are sampled instruments, not multi-velocity physical models. Manual trumpet/flute/pan-flute voices use cached sustain loops selected by waveform similarity and blended over 60 ms; the attack is preserved and the loop seam follows adjacent waveform samples.

All instrument recordings are bundled under `public/audio/instruments/`, so runtime playback has no sound-CDN dependency. The expanded exact-pitch bank takes longer to decode on first use. The Play screen waits for every sample and the reverb to be ready. Failed loads show a retry instead of enabling silent instruments. A short, restrained convolution reverb adds space to pitched instruments; the acoustic drums remain dry and all voices feed the master limiter.

Credits and sample licenses are included in [the attribution document](../public/audio/instruments/ATTRIBUTION.md). FluidR3 samples follow the distribution's CC-BY 3.0 notice, MuldjordKit uses CC-BY 4.0, and the clap is CC0. Upstream drum license documents are included alongside the audio.

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
- Where supported, FarmJam requests `navigator.audioSession.type = 'playback'` before unlocking audio, so iOS uses media playback instead of silencing Web Audio with the ringer switch. Unsupported or rejected Audio Session APIs do not block ordinary playback. See [WebKit's silent-switch report and resolution](https://bugs.webkit.org/show_bug.cgi?id=237322).
- Audio unlock/recovery has a five-second timeout. A fresh tap or key press makes a new native resume attempt even when an automatic resume is still pending. Audio-context closure and Audio Session interruptions stop owned playback and expose their status through the sound-help symbol; an inactive session alone is not treated as a failure.
- The speaker symbol opens optional sound help from the menu, landscape and practice room. It highlights detectable paused/blocked/closed audio or a fully muted session mix. Retry plays a quiet test note through the existing master limiter. Browser state and even an internal output meter cannot establish that the device speaker is audible: hardware volume, Silent mode, tab mute and output routing may remain invisible. The symbol stays available when the browser reports running audio.
- Backgrounding, page hiding, or an audio-context interruption stops the transport, clears pending notes and UI cues, and releases held manual inputs and sounding samples. On return, active instruments and the metronome restart together at a fresh downbeat rather than trying to replay missed callbacks. Instrument selections, active states, tempo, and sound settings are retained. If the browser requires a gesture to resume audio, the next tap/key press retries recovery.
- Trumpet lip and valve ownership is cleared on blur, backgrounding, and audio interruption. Window-level pointer release/cancel and mouse-button-loss handling prevent missed local releases from leaving an indefinitely looping wind voice.
- Bar downbeats use the transport callback's audio timestamp directly; later notes use transport positions. Drum labels map to explicit sampler pitches and hit-specific durations.
- All seven landscapes have at least two interactive objects.
- Instrument volume settings are remembered when a muted instrument is switched back on.
- Opening the mixer requires two clicks or taps within 450 ms; a single click/tap still closes it. Keyboard users can activate the focused mixer button twice with Enter or Space.
- Equipping adds a transient +3 dB boost to that instrument's base mixer level, capped at 0 dB; -60 dB mute remains muted. Putting it down removes the boost without changing the base mix or stored preferences.
- The mixer has one shared **Scenery sounds** slider for all non-instrument sounds, including a mute setting at -60 dB. Its setting lasts across scenes within the play session and does not alter instrument levels.
- Sound sliders and **Restore defaults** apply immediately to the live session. Restore resets every instrument's base gain and scenery gain, preserving active states and instrument/display preferences. Sound levels are not saved on Settings close; instrument/display preferences save as they change.
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

The usual regular objects listed under **Environments** remain the default, with their existing sounds and tap responses; a visitor changes only its replacement slot for that visit. Visitors have matching illustrations, tap animations and sound effects. Sheep, horse, duck, fox and dove use real **CC0 1.0 recordings**. The other nine visitors use original illustrative foley matched to their actions, not recorded wildlife: bumblebee wing buzz, woodpecker knocks, otter splashes, cicada rasp, hot-air balloon burner air, badger leaf scuffs and sniffs, luna moth flutter, an imaginary shooting-star whistle and shimmer, and deer hoof impacts and a snort. Detailed recording sources, creators, licenses, excerpt processing and original foley descriptions are in [Scenery Attribution](../public/audio/scenery/ATTRIBUTION.md#visitor-recordings).

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
3. **Rhythm** gives a four-beat count-in, then repeats the selected phrase with live highlights and a hit/timing score. Note starts are scored within half a beat of their target; the duration display is a hold guide and duration is not scored. Next becomes enabled after a correct performance of the entire phrase in this timed stage.
4. **Together** repeats the timed exercise with two quieter partner instruments, cycling their motifs each bar over fixed harmony compatible with the exercise, not the landscape's changing progression. The selected instrument's phrase stays fixed and is never automatically played for you. Finish becomes enabled after a correct performance of the entire phrase in this stage.

Practice retains its existing authored exercises first, then adds the landscape composer's playable accompaniment and melody motifs. New choices show their motif, role and chord; all choices follow the saved instrument difficulty and scene key. Learn accepts complete grouped events, including every required chord note.

Orange duration bars on the phrase track and playable controls shrink to show the remaining note hold time. Switch instruments, phrases, or stages at any time. Ready/Repeat and Restart controls have their own row above the playable surface on small screens; the practice metronome is in the header, not at the landscape's bottom-left position. Timed attempts can be stopped or restarted; the open door or Escape returns to the landscape. Backgrounding or losing focus pauses practice and clears held inputs. Leaving restores the farm's active parts, equipment, pinned phrase, tempo, and metronome sound, restarting on a fresh shared downbeat. String guidance uses the highlighted chord's exact canonical notes, strings and frets; a different held chord still sounds its own canonical notes.

## Environments

1. **Sunny Farm** — cow and tractor
2. **Little Garden** — outdoor faucet and bird
3. **Pond Meadow** — frog and windmill
4. **Evening Meadow** — a setting sun, early stars and fireflies, a chirping cricket and a banking propeller airplane
5. **Sleepy Night** — the first moonrise, with bell and owl
6. **Moonlit Meadow** — a distinct late-night willow grove, silver stream and moonflowers, with a fluttering bat and rustling hedgehog
7. **First Light** — pale, cold pre-dawn light over blue-grey misty fields, a recorded rooster crow and swaying wind chimes

The circular arrow control in the bottom-right rotates through the scenes. The illustrations include rolling fields, a flower garden, reflective pond water, and a moonlit woodland with fireflies. Scenery proportions adapt to portrait and landscape screens.

In Evening Meadow, tapping the cricket makes it hop and rub its wings to a real CC0 cricket recording. The farm cow also plays a real CC0 moo recording. Source credits and reproducible processing commands are in [the scenery attribution file](../public/audio/scenery/ATTRIBUTION.md). The airplane triggers a short banking flyby, spinning propeller and a soft tapered engine sound. Late-night bat wings and hedgehog footsteps have distinct original foley rendered to local WAVs. All effects use offline loudness analysis and the shared scenery mixer; reduced-motion preferences apply to their visual reactions.

## Interactive objects

Placement follows each object's identity, not the location of the slot it replaces. [Scene.jsx](../src/scenes/Scene.jsx) imports [object-placement.css](../src/scenes/object-placement.css) after the animation styles; its anchors align objects with the scenery in [LandscapeArt.jsx](../src/scenes/LandscapeArt.jsx). Cow, sheep, horse and tractor occupy the farm ground/pasture; faucet stands on garden ground; rooster, cricket, cicada, hedgehog, fox, badger and deer stay on dry ground. Bird, owl and dove perch by tree branches, bell and chimes hang by branches, woodpecker has a rooted stump, and bees hover at the flowerbed. Duck and otter swim in the pond, frog sits on the dry left bank, and windmill stands on the right bank. Airplane, bat, balloon, luna moth and shooting star use sky anchors.

Standard object widths use `clamp(76px, min(13.4vh, 12vw), 120px)`, with height at 87.5% of width. Windmill is square at 90-160px; tractor is 84-145px; airplane is 76-128px. Horizontal bounds retain a 4px inset. Short landscapes adjust branch, stump, windmill and bat positions; opening a manual instrument preserves object sizes and shifts the duck from 53% to 62% across the scene to clear the held instrument. The pond bank artwork remains a small supporting detail rather than a replacement for per-object anchors.

Each object has a distinct sound and a replayable response: the cow nods and moos, the tractor rattles with exhaust, the faucet makes three gentle drips with animated falling drops and impact ripples, the bird flies and chirps, the frog leaps and croaks with ripples, the windmill spins faster with airy wooden clacks, the bell swings and rings, and the owl blinks and hoots. Reduced-motion preferences are respected.

The faucet uses one shared audio/animation timeline: quiet drop impacts at 0.28, 0.93 and 1.58 seconds, with silence between them. Animation start time accounts for the browser audio-output clock. Repeated taps restart the faucet sequence instead of stacking multiple leaks. Other scenery sounds retain their overlapping tap voices.

The faucet now uses an actual recorded water drop rather than a synthesized plop; the sunrise rooster is also a real recording. Both are CC0, bundled locally, and credited in [Scenery Attribution](../public/audio/scenery/ATTRIBUTION.md). Other object sounds are original procedural effects rendered to local WAV assets offline. No sound CDN is used during playback. Samples have tapered endpoints; the master limiter also covers scene sounds.

## Measured Default Balance

Every playback asset is decoded and analyzed offline using FFmpeg: integrated EBU R128/BS.1770 loudness (LUFS), full-waveform RMS, gated active RMS, and true/sample peak. Silence is excluded from the active RMS calculation using 50 ms blocks within 20 dB of the loudest block. Gated active RMS is the fallback for clips too short to yield finite integrated LUFS.

The analyzer precalculates a gain toward -20 LUFS for instrument recordings, -23 LUFS for scenery, and a deliberately quieter -26 LUFS target for dripping water. Corrections are bounded to -24 through +18 dB and constrained by a -5 dBFS true/sample-peak ceiling. Transient-heavy samples may remain below the loudness target to preserve their peaks; this is linear gain, not compression. The instrument mixer defaults and authored note velocities then retain the musical foreground/accompaniment balance.

Default mixer gains are calibrated separately for comparable played-note output: piano -9, drums -6, guitar -9, trumpet -4, marimba -14, flute -3, ukulele -13 and pan flute -6 dB. Identical slider values would not balance these different envelopes and timbres. A browser regression renders the actual corrected buffers and wind sustain loops offline at a common velocity, compares representative C4 notes (C5 for marimba and kick for drums), and requires peak-window RMS levels to stay within 6 dB. Offline rendering captures short attacks without animation-frame timing loss. This is a reference-note check, not a claim that every pitch, chord or phrase has identical perceived loudness; existing live full-mix headroom checks remain unchanged.

The complete measurements, asset SHA-256 hashes and gains are committed in [audioLevels.json](../src/audio/audioLevels.json). Instrument corrections are applied once to decoded sample buffers; scenery corrections are applied to each player's gain, before the shared scenery slider. No loudness analysis runs during playback. Tests reject stale measurements when an audio asset changes, verify runtime gain application, and exercise the full mix through the master limiter.

Regenerate the recordings and calibration with:

```bash
npm run scenery:download
npm run audio:analyze
npm test
```

To add measurements for new recordings without replacing existing gain choices, run `npm run audio:analyze -- --preserve-existing`. Gains are retained only when the asset hash is unchanged.

The analyzer also regenerates the original procedural scenery WAVs and builds the three-drop faucet sequence at its existing animated impact times, with a two-second duration so the last recorded drop can decay naturally. The download scripts never execute remote JavaScript. FFmpeg is a development-only dependency; it is not shipped to browsers.






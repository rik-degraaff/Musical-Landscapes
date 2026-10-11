# Scenery Audio

- Water: "Water drop (splash)" by bolkmar, recorded in a bathroom with a Tascam DR-05 V2. [Source](https://freesound.org/people/bolkmar/sounds/451126/), [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). The HQ MP3 preview is bundled; a trimmed, faded drop is repeated three times in the faucet sequence.
- Rooster: "Rooster crow" by arelitron, a Polish rooster recorded with a ZOOM H1N. [Source](https://freesound.org/people/arelitron/sounds/582624/), [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). The HQ MP3 preview is bundled and converted to WAV with endpoint fades.
- Cow (`moo`): "Cow Moo 2" by invertedturtle, recorded in Bindera, New South Wales, Australia. [Source](https://freesound.org/people/invertedturtle/sounds/546479/), [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). The HQ MP3 preview is bundled as `source/cow-moo.mp3`; its first 2.623 seconds are downmixed to mono, resampled to 48 kHz and faded over 15 ms at the start and 80 ms at the end. No pitch shifting or synthesized cow layer.
- Cricket (`cricket`): "cricket chirping (slow)" by _sinny_, a real cricket recorded with a Rode VideoMicro. [Source](https://freesound.org/people/_sinny_/sounds/822935/), [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). The HQ MP3 preview is bundled as `source/cricket.mp3`; its first 2.4 seconds are downmixed to mono, resampled to 48 kHz and faded over 15 ms at the start and 60 ms at the end. Natural chirp timing is retained; no synthetic oscillator layer.
- Non-recorded scenery effects, including wind chimes, bat wing flutter (`bat`) and hedgehog leaf rustle (`hedgehog`), are original procedural sounds. The bat and hedgehog are illustrative foley, not claimed wildlife recordings. All playback gain corrections are calculated offline from waveform/loudness measurements.

## Visitor Recordings

The following individual Freesound pages and their explicit [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) license links were verified on 2026-10-11. The published HQ MP3 previews are bundled in `source/visitor-*.mp3`; no unverified recording or human animal impersonation is used. Metadata and exact preview URLs are in `VISITOR_RECORDINGS` in `src/audio/visitorSounds.js`, merged into the existing `FIELD_RECORDINGS` pipeline. All excerpts are downmixed to mono and resampled to 48 kHz; no pitch shifting or synthetic animal-call layer is added. Background sound present in the recordings is retained, not claimed to be studio-isolated.

| ID | Recording and Creator | Source | Rendered Excerpt and Processing |
| --- | --- | --- | --- |
| `sheep` | "Sheep baaing 5 - Norwegian sheep expressing itself concisely", michaelperfect. Norwegian sheep recorded with a RODE VideoMic in August 2023. | [710300](https://freesound.org/people/michaelperfect/sounds/710300/) | `source/visitor-sheep.mp3`; 0-1.825 s; fixed amplitude multiplier 0.85 to keep the peak below 0.9; 15 ms / 80 ms endpoint fades. |
| `horse` | "horse", dontwanttobehere. A horse neighing for snacks, with farm sounds in the background. | [656661](https://freesound.org/people/dontwanttobehere/sounds/656661/) | `source/visitor-horse.mp3`; 0.5-5.9 s (5.4 s), skipping the quiet lead-in; 25 ms / 120 ms fades. |
| `duck` | "Ducks Quacking To Each Other", OwennewO. A male and female duck quacking together. | [719115](https://freesound.org/people/OwennewO/sounds/719115/) | `source/visitor-duck.mp3`; 0-1.254 s; 15 ms / 60 ms fades. |
| `fox` | "red fox screeching.mp3", craigsays. Red fox calls, described as screeching by the uploader. | [537587](https://freesound.org/people/craigsays/sounds/537587/) | `source/visitor-fox.mp3`; 6.3-9.1 s (2.8 s), selecting isolated calls; 30 ms / 120 ms fades. |
| `dove` | "Collared Dove", D4XX. Recording of a collared dove. | [607243](https://freesound.org/people/D4XX/sounds/607243/) | `source/visitor-dove.mp3`; 0-1.598 s; 25 ms / 100 ms fades. |

The preview URLs were extracted from the individual pages, not inferred from titles. CC0 permits redistribution and modification, including commercial use. The source previews are retained for offline reproduction. License verification is recorded here and in the metadata; it is not a claim that an automated unit test can establish copyright ownership.

## Original Visitor Foley

These nine WAVs are original, deterministic procedural sound designs from `src/audio/visitorSounds.js`. They contain no third-party audio and carry no claimed external recording license. Animal effects in this table are illustrative foley, not recorded wildlife. Each uses layered, sample-rate-aware noise or resonances, a per-ID noise seed, smooth endpoint fades and a 0.8 peak normalization before 16-bit PCM encoding.

| ID | Duration | Actual Sound Nature |
| --- | --- | --- |
| `bee` | 2.2 s | Wandering wing fundamental and multiple harmonics, turbulent air, varied amplitude and a gentle approach/recede envelope. |
| `woodpecker` | 1.6 s | Two irregular rolls of short dry knocks, using three inharmonic wood-body resonances and noisy attacks with silence between rolls. |
| `otter` | 2.4 s | Five small paw splashes with filtered water noise, rising bubble resonances and a trailing low ripple. No otter vocalization is claimed. |
| `cicada` | 2.2 s | Swelling broadband rasp, fast pulse modulation, drifting resonant carrier and an inharmonic overtone. |
| `balloon` | 2.4 s | A soft valve tick followed by a swelling burner air burst with turbulent low roar. |
| `badger` | 2.2 s | Five dry leaf scuffs and two breathy nasal sniffs. No badger vocalization is claimed. |
| `moth` | 1.8 s | Quiet papery air flutter with changing wing cadence and irregular amplitude. |
| `shootingStar` | 2.6 s | Imaginary soft descending whistle, air and staggered shimmering resonances; not a physical meteor recording. |
| `deer` | 2.4 s | Four softly paired hoof impacts on earth followed by a filtered, breathy snort. |

Visitor playback uses the existing offline -23 LUFS target and -5 dBFS corrected peak ceiling, not runtime normalization. Recorded sounds retain their natural waveform; original foley has distinct event timing and spectral structure.

```sh
npm run scenery:download -- --sounds=sheep,horse,duck,fox,dove
npm run audio:analyze -- --preserve-existing --sounds=sheep,horse,bee,woodpecker,duck,otter,cicada,balloon,fox,badger,moth,shootingStar,dove,deer
node --test tests/sceneSounds.test.js tests/audioLevels.test.js tests/visitorSounds.test.js
```

## Reproduction

Source licenses were verified on the linked Freesound pages on 2026-10-10. CC0 permits redistribution and modification, including commercial use. Anonymous HQ preview downloads follow the existing water/rooster convention; no account or API key is needed. Exact download URLs and processing parameters are in `FIELD_RECORDINGS` in `src/audio/sceneSounds.js`.

From the repository root, using the installed `ffmpeg-static` toolchain:

```sh
npm run scenery:download -- --sounds=moo,cricket
npm run audio:analyze -- --preserve-existing --sounds=moo,cricket,bat,hedgehog
node --test tests/sceneSounds.test.js tests/audioLevels.test.js
```

The analyzer writes 16-bit mono PCM WAVs and measures LUFS, RMS and true peak offline. These four effects use the existing -23 LUFS target and -5 dBFS corrected peak ceiling. `--sounds` limits waveform generation; `--preserve-existing` keeps unchanged assets' static levels exactly. Omitting `--sounds` reproduces all scenery, including the original water and rooster processing. The bundled source previews allow offline processing even when Freesound is unavailable; their redistribution is covered by the same CC0 licenses.

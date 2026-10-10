# Scenery Audio

- Water: "Water drop (splash)" by bolkmar, recorded in a bathroom with a Tascam DR-05 V2. [Source](https://freesound.org/people/bolkmar/sounds/451126/), [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). The HQ MP3 preview is bundled; a trimmed, faded drop is repeated three times in the faucet sequence.
- Rooster: "Rooster crow" by arelitron, a Polish rooster recorded with a ZOOM H1N. [Source](https://freesound.org/people/arelitron/sounds/582624/), [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). The HQ MP3 preview is bundled and converted to WAV with endpoint fades.
- Cow (`moo`): "Cow Moo 2" by invertedturtle, recorded in Bindera, New South Wales, Australia. [Source](https://freesound.org/people/invertedturtle/sounds/546479/), [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). The HQ MP3 preview is bundled as `source/cow-moo.mp3`; its first 2.623 seconds are downmixed to mono, resampled to 48 kHz and faded over 15 ms at the start and 80 ms at the end. No pitch shifting or synthesized cow layer.
- Cricket (`cricket`): "cricket chirping (slow)" by _sinny_, a real cricket recorded with a Rode VideoMicro. [Source](https://freesound.org/people/_sinny_/sounds/822935/), [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). The HQ MP3 preview is bundled as `source/cricket.mp3`; its first 2.4 seconds are downmixed to mono, resampled to 48 kHz and faded over 15 ms at the start and 60 ms at the end. Natural chirp timing is retained; no synthetic oscillator layer.
- Other scenery effects, including wind chimes, bat wing flutter (`bat`) and hedgehog leaf rustle (`hedgehog`), are original procedural sounds. The bat and hedgehog are illustrative foley, not claimed wildlife recordings. All playback gain corrections are calculated offline from waveform/loudness measurements.

## Reproduction

Source licenses were verified on the linked Freesound pages on 2026-10-10. CC0 permits redistribution and modification, including commercial use. Anonymous HQ preview downloads follow the existing water/rooster convention; no account or API key is needed. Exact download URLs and processing parameters are in `FIELD_RECORDINGS` in `src/audio/sceneSounds.js`.

From the repository root, using the installed `ffmpeg-static` toolchain:

```sh
npm run scenery:download -- --sounds=moo,cricket
npm run audio:analyze -- --preserve-existing --sounds=moo,cricket,bat,hedgehog
node --test tests/sceneSounds.test.js tests/audioLevels.test.js
```

The analyzer writes 16-bit mono PCM WAVs and measures LUFS, RMS and true peak offline. These four effects use the existing -23 LUFS target and -5 dBFS corrected peak ceiling. `--sounds` limits waveform generation; `--preserve-existing` keeps unchanged assets' static levels exactly. Omitting `--sounds` reproduces all scenery, including the original water and rooster processing. The bundled source previews allow offline processing even when Freesound is unavailable; their redistribution is covered by the same CC0 licenses.

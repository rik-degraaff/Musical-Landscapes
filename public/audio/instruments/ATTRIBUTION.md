# Instrument Sample Attribution

The piano, nylon acoustic guitar, trumpet, marimba, flute and pan flute MP3 samples are extracted from the FluidR3 GM soundfont distributions hosted by Benjamin Gleitz's MIDI.js Soundfonts project.

- Soundfont: FluidR3 GM, originally by Frank Wen, with contributions by the Fluid soundfont authors.
- Distribution: <https://github.com/gleitz/midi-js-soundfonts>
- Sample license, as declared by that distribution: Creative Commons Attribution 3.0 United States, <https://creativecommons.org/licenses/by/3.0/us/>
- Source files: <https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/>
- Changes: selected note recordings were extracted from base64 into standalone MP3 files, with sharp-note filenames changed to `s`. Tone.js resamples nearby notes and applies playback envelopes and mixer levels at runtime. No source recordings were re-encoded.

The original distribution's MIT code license does not replace the soundfont sample license. The recordings and this attribution are bundled locally; the app does not request them from a third-party CDN at runtime.

## Ukulele

Real Flight Fireball tenor ukulele recordings by Mateusz Dąbrowski, recorded with a RODE Podcaster microphone and published by FreePats as Ukulele version 2026-08-11. These are not renamed guitar or General MIDI recordings.

- Publisher and recording details: <https://freepats.zenvoid.org/GuitarFamily/ukulele.html>
- Pinned source: <https://github.com/freepats/ukulele1/tree/86d345f6f7b79a106ace98eca0da19b087786dba>
- License verified in the publisher page, README and LICENSE: CC0 1.0 Universal, <https://creativecommons.org/publicdomain/zero/1.0/>
- License evidence: <https://github.com/freepats/ukulele1/blob/86d345f6f7b79a106ace98eca0da19b087786dba/LICENSE.txt>
- Recording and upstream processing details: <https://github.com/freepats/ukulele1/blob/86d345f6f7b79a106ace98eca0da19b087786dba/README.txt>
- Original pitch map: <https://github.com/freepats/ukulele1/blob/86d345f6f7b79a106ace98eca0da19b087786dba/Ukulele%2020260811.sfz>
- Bundled roots: C4, D4, E4, F#4, G4, A4, B4, C#5, D#5, F5, G5, A5, C6 in `ukulele/`, as original 48 kHz / 24-bit mono FLAC files. Sharps in local filenames become `s` (e.g. `Fs4.flac`). No re-encoding, trimming, denoising or pitch shifting was performed here.
- The source's recorded range ends at C6. Tone.Sampler supplies intermediate notes and the requested upper extension through E6 by resampling; E6 is four semitones above the highest recorded root, not a separately recorded note. The original SFZ's per-root tuning corrections (-11 to +8 cents) are not applied by this sample map; the recordings retain their natural tuning.

## Pan Flute

FluidR3 GM `pan_flute`, distributed by Benjamin Gleitz under CC BY 3.0 United States as documented above. License declaration: <https://github.com/gleitz/midi-js-soundfonts#soundfonts-available>. Exact source: <https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/pan_flute-mp3.js>.

All 22 chromatic notes from C4 through A5 are bundled in `panflute/`. D5 transposed upward by nine semitones is B5, two semitones beyond this bank; Tone.Sampler covers that pitch by resampling A5, not with a separate recording. Files are extracted from the JSON note map without executing remote JavaScript and without re-encoding.

Reproduce only the new banks: `node scripts/download-instruments.mjs --only ukulele,panflute`. Add calibration entries using `npm run audio:analyze -- --preserve-existing`; existing entries are preserved when their audio SHA-256 matches.

## Acoustic Drums

Kick, snare, closed hi-hat, high tom, floor tom, crash and ride: MuldjordKit drum recordings by Lars Muldjord; FreePats stereo version assembled by <roberto@zenvoid.org>. Drum samples provided by DrumGizmo.org. Licensed under CC BY 4.0, <https://creativecommons.org/licenses/by/4.0/>. Source: <https://github.com/freepats/muldjordkit>. Original FLAC files are bundled unchanged. Shortened snare and hi-hat playback is also used for rim/shaker accents. The original README and license are included beside this file.

Hand clap: "Clap-9.wav" by Sorinious_Genious, CC0, <https://freesound.org/people/Sorinious_Genious/sounds/561119/>. The publicly available HQ MP3 preview is bundled unchanged.

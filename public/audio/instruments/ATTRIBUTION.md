# Instrument Sample Attribution

The piano, nylon acoustic guitar, trumpet, marimba and flute MP3 samples are extracted from the FluidR3 GM soundfont distributions hosted by Benjamin Gleitz's MIDI.js Soundfonts project.

- Soundfont: FluidR3 GM, originally by Frank Wen, with contributions by the Fluid soundfont authors.
- Distribution: <https://github.com/gleitz/midi-js-soundfonts>
- Sample license, as declared by that distribution: Creative Commons Attribution 3.0 United States, <https://creativecommons.org/licenses/by/3.0/us/>
- Source files: <https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/>
- Changes: selected note recordings were extracted from base64 into standalone MP3 files, with sharp-note filenames changed to `s`. Tone.js resamples nearby notes and applies playback envelopes and mixer levels at runtime. No source recordings were re-encoded.

The original distribution's MIT code license does not replace the soundfont sample license. The recordings and this attribution are bundled locally; the app does not request them from a third-party CDN at runtime.

## Acoustic Drums

Kick, snare, closed hi-hat and tom: MuldjordKit drum recordings by Lars Muldjord; FreePats stereo version assembled by <roberto@zenvoid.org>. Drum samples provided by DrumGizmo.org. Licensed under CC BY 4.0, <https://creativecommons.org/licenses/by/4.0/>. Source: <https://github.com/freepats/muldjordkit>. Original FLAC files are bundled unchanged. Shortened snare and hi-hat playback is also used for rim/shaker accents. The original README and license are included beside this file.

Hand clap: "Clap-9.wav" by Sorinious_Genious, CC0, <https://freesound.org/people/Sorinious_Genious/sounds/561119/>. The publicly available HQ MP3 preview is bundled unchanged.

# FingerFinder

A guitar chord/scale explorer. Build a chord from dropdowns (root, quality,
suspension, added tones) and see every physically playable way to voice it
across the fretboard, with note names and interval labels on each dot.

## Features

- **Chord builder**: root note, quality (major/minor/augmented/diminished),
  suspensions (sus2/sus4), and 7th/extension (6, 6/9, 7, maj7, 9, maj9, 11,
  maj11, 13, maj13, add9/11/13, dim7).
- **Correct spelling**: chord tones are spelled using real interval math
  (e.g. the minor 3rd of C is Eb, not D#), not just semitone lookups.
- **Playable voicing search**: only shows shapes that respect a max fret
  stretch (default 4 frets) and a max finger count (default 4), with
  barre-chord-aware finger counting and a check that no finger is asked to
  reach across 2+ ringing open strings.
- **Position navigator**: cycle through every found voicing, grouped and
  labeled by fretboard position (open, 1st fret, 3rd fret, ...).
- **Custom tuning**: change any string's pitch individually, or pick a
  preset (Drop D, DADGAD, Open G, Open D, half/full step down); voicings
  recompute live.
- **Scale finder**: lists every scale (from a 15-scale library covering
  modes, pentatonics, blues, whole tone, and both diminished scales) that
  contains all of the chord's tones, both at the chord's own root and at
  other roots, then maps any of them across the full fretboard.

## Development

```bash
npm install
npm run dev      # start the dev server
npm test         # run the music-theory engine's unit tests
npm run build    # typecheck + production build
npm run lint     # oxlint
```

The music theory engine (note/interval spelling, chord formulas, the
voicing search, and scale matching) lives in `src/music/` and is covered by
unit tests in `src/music/__tests__/`. UI components live in
`src/components/`.

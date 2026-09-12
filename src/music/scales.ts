import type { Chord } from "./chords";
import {
  mod12,
  pitchClass,
  spellFromRoot,
  spellingToString,
  type NoteSpelling,
} from "./notes";

export interface ScaleDef {
  id: string;
  name: string;
  /** Ascending semitone offsets from the root, always starting with 0. */
  semitones: number[];
}

export const SCALES: ScaleDef[] = [
  { id: "major", name: "Major (Ionian)", semitones: [0, 2, 4, 5, 7, 9, 11] },
  { id: "dorian", name: "Dorian", semitones: [0, 2, 3, 5, 7, 9, 10] },
  { id: "phrygian", name: "Phrygian", semitones: [0, 1, 3, 5, 7, 8, 10] },
  { id: "lydian", name: "Lydian", semitones: [0, 2, 4, 6, 7, 9, 11] },
  { id: "mixolydian", name: "Mixolydian", semitones: [0, 2, 4, 5, 7, 9, 10] },
  {
    id: "natural_minor",
    name: "Natural Minor (Aeolian)",
    semitones: [0, 2, 3, 5, 7, 8, 10],
  },
  { id: "locrian", name: "Locrian", semitones: [0, 1, 3, 5, 6, 8, 10] },
  {
    id: "harmonic_minor",
    name: "Harmonic Minor",
    semitones: [0, 2, 3, 5, 7, 8, 11],
  },
  {
    id: "melodic_minor",
    name: "Melodic Minor (ascending)",
    semitones: [0, 2, 3, 5, 7, 9, 11],
  },
  {
    id: "major_pentatonic",
    name: "Major Pentatonic",
    semitones: [0, 2, 4, 7, 9],
  },
  {
    id: "minor_pentatonic",
    name: "Minor Pentatonic",
    semitones: [0, 3, 5, 7, 10],
  },
  { id: "blues", name: "Blues", semitones: [0, 3, 5, 6, 7, 10] },
  { id: "whole_tone", name: "Whole Tone", semitones: [0, 2, 4, 6, 8, 10] },
  {
    id: "dim_whole_half",
    name: "Diminished (Whole-Half)",
    semitones: [0, 2, 3, 5, 6, 8, 9, 11],
  },
  {
    id: "dim_half_whole",
    name: "Diminished (Half-Whole)",
    semitones: [0, 1, 3, 4, 6, 7, 9, 10],
  },
];

// One canonical spelling per pitch class, used when listing scales rooted
// away from the chord's own root (where there's no single "correct"
// spelling to derive from context).
export const CHROMATIC_ROOTS_FOR_DISPLAY: NoteSpelling[] = [
  { letter: "C", accidental: 0 },
  { letter: "C", accidental: 1 },
  { letter: "D", accidental: 0 },
  { letter: "E", accidental: -1 },
  { letter: "E", accidental: 0 },
  { letter: "F", accidental: 0 },
  { letter: "F", accidental: 1 },
  { letter: "G", accidental: 0 },
  { letter: "A", accidental: -1 },
  { letter: "A", accidental: 0 },
  { letter: "B", accidental: -1 },
  { letter: "B", accidental: 0 },
];

const SEMITONE_TO_DEGREE_LABEL: Record<number, string> = {
  0: "R",
  1: "b2",
  2: "2",
  3: "b3",
  4: "3",
  5: "4",
  6: "b5",
  7: "5",
  8: "#5",
  9: "6",
  10: "b7",
  11: "7",
};

export interface ScaleTone {
  pitchClass: number;
  noteName: string;
  degreeLabel: string;
}

export function scaleTones(root: NoteSpelling, scale: ScaleDef): ScaleTone[] {
  const rootPc = pitchClass(root);
  return scale.semitones.map((semi, idx) => {
    const spelled = spellFromRoot(root, idx, semi);
    return {
      pitchClass: mod12(rootPc + semi),
      noteName: spellingToString(spelled),
      degreeLabel: SEMITONE_TO_DEGREE_LABEL[mod12(semi)] ?? "?",
    };
  });
}

export interface ScaleMatch {
  scale: ScaleDef;
  root: NoteSpelling;
  displayName: string;
}

export interface ScaleMatches {
  sameRoot: ScaleMatch[];
  otherRoots: ScaleMatch[];
}

function scalePitchClassSet(root: NoteSpelling, scale: ScaleDef): Set<number> {
  const rootPc = pitchClass(root);
  return new Set(scale.semitones.map((semi) => mod12(rootPc + semi)));
}

export function findScalesForChord(chord: Chord): ScaleMatches {
  const chordPitchClasses = [...new Set(chord.tones.map((t) => t.pitchClass))];

  const sameRoot: ScaleMatch[] = [];
  for (const scale of SCALES) {
    const pcSet = scalePitchClassSet(chord.root, scale);
    if (chordPitchClasses.every((pc) => pcSet.has(pc))) {
      sameRoot.push({
        scale,
        root: chord.root,
        displayName: `${spellingToString(chord.root)} ${scale.name}`,
      });
    }
  }

  const chordRootPc = pitchClass(chord.root);

  const otherRoots: ScaleMatch[] = [];
  for (const root of CHROMATIC_ROOTS_FOR_DISPLAY) {
    const rootPc = pitchClass(root);
    if (rootPc === chordRootPc) continue;
    for (const scale of SCALES) {
      const pcSet = scalePitchClassSet(root, scale);
      if (chordPitchClasses.every((pc) => pcSet.has(pc))) {
        otherRoots.push({
          scale,
          root,
          displayName: `${spellingToString(root)} ${scale.name}`,
        });
      }
    }
  }

  return { sameRoot, otherRoots };
}

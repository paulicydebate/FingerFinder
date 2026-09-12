// Core pitch spelling utilities: letters + accidentals, so chord/scale tones
// are spelled correctly (e.g. minor 3rd of C is Eb, not D#) instead of just
// picking an arbitrary enharmonic spelling from a semitone count.

export const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
export type Letter = (typeof LETTERS)[number];

// Semitone value of each natural letter, relative to C = 0.
const LETTER_SEMITONES: Record<Letter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const ACCIDENTAL_SYMBOLS: Record<number, string> = {
  [-2]: "bb",
  [-1]: "b",
  [0]: "",
  [1]: "#",
  [2]: "x",
};

export interface NoteSpelling {
  letter: Letter;
  accidental: number; // -2..2 (bb, b, natural, #, x)
}

export function mod12(n: number): number {
  return ((n % 12) + 12) % 12;
}

export function mod7(n: number): number {
  return ((n % 7) + 7) % 7;
}

export function pitchClass(spelling: NoteSpelling): number {
  return mod12(LETTER_SEMITONES[spelling.letter] + spelling.accidental);
}

export function spellingToString(spelling: NoteSpelling): string {
  return `${spelling.letter}${ACCIDENTAL_SYMBOLS[spelling.accidental] ?? ""}`;
}

/**
 * Spell the note that is `letterSteps` letter-names above the root (0 = same
 * letter, 1 = next letter, ... used mod 7) and `semitones` above the root in
 * pitch. This lets us derive correct spellings for arbitrary intervals
 * (e.g. a major 3rd is always 2 letter-steps + 4 semitones above the root).
 */
export function spellFromRoot(
  root: NoteSpelling,
  letterSteps: number,
  semitones: number,
): NoteSpelling {
  const rootLetterIndex = LETTERS.indexOf(root.letter);
  const targetLetterIndex = mod7(rootLetterIndex + letterSteps);
  const targetLetter = LETTERS[targetLetterIndex];
  const targetPitchClass = mod12(pitchClass(root) + semitones);
  const naturalTargetSemitone = LETTER_SEMITONES[targetLetter];

  // Find the accidental (in -2..2) that makes the natural letter reach the
  // target pitch class, preferring the smallest absolute accidental and
  // resolving ties toward the sign that matches typical spelling.
  let bestAccidental = 0;
  let bestDistance = Infinity;
  for (let acc = -2; acc <= 2; acc++) {
    const candidatePitch = mod12(naturalTargetSemitone + acc);
    // compare using shortest circular distance
    let diff = Math.abs(candidatePitch - targetPitchClass);
    diff = Math.min(diff, 12 - diff);
    if (candidatePitch === targetPitchClass && Math.abs(acc) < bestDistance) {
      bestDistance = Math.abs(acc);
      bestAccidental = acc;
    }
  }

  return { letter: targetLetter, accidental: bestAccidental };
}

// All 17 commonly used root spellings a user might pick from a dropdown.
export const ROOT_OPTIONS: NoteSpelling[] = [
  { letter: "C", accidental: 0 },
  { letter: "C", accidental: 1 },
  { letter: "D", accidental: -1 },
  { letter: "D", accidental: 0 },
  { letter: "D", accidental: 1 },
  { letter: "E", accidental: -1 },
  { letter: "E", accidental: 0 },
  { letter: "F", accidental: 0 },
  { letter: "F", accidental: 1 },
  { letter: "G", accidental: -1 },
  { letter: "G", accidental: 0 },
  { letter: "G", accidental: 1 },
  { letter: "A", accidental: -1 },
  { letter: "A", accidental: 0 },
  { letter: "A", accidental: 1 },
  { letter: "B", accidental: -1 },
  { letter: "B", accidental: 0 },
];

export function rootOptionKey(spelling: NoteSpelling): string {
  return spellingToString(spelling);
}

// Chromatic pitch-class names used for generic display (e.g. tuning pickers)
// where we don't need root-relative spelling.
export const CHROMATIC_SHARP = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
export const CHROMATIC_FLAT = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

export function midiToName(midi: number, preferFlat = false): string {
  const pc = mod12(midi);
  const table = preferFlat ? CHROMATIC_FLAT : CHROMATIC_SHARP;
  const octave = Math.floor(midi / 12) - 1;
  return `${table[pc]}${octave}`;
}

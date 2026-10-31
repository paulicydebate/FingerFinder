import { buildChord, type Chord } from "./chords";
import {
  DIMINISHED_ONLY_EXTENSIONS,
  EXTENSION_OPTIONS,
  QUALITY_OPTIONS,
  SUS_OPTIONS,
} from "./chordFormulas";
import { mod12, pitchClass } from "./notes";
import { CHROMATIC_ROOTS_FOR_DISPLAY } from "./scales";
import type { Tuning } from "./tuning";
import { countFingers, toneByPitchClassMap, type ChordShape } from "./voicings";

export interface ChordMatch {
  chord: Chord;
  /** True when the lowest-sounding string's note is this chord's root. */
  bassIsRoot: boolean;
  /** True when every one of the chord's tones (not just the required ones) was played. */
  exact: boolean;
  score: number;
}

export interface IdentifyOptions {
  maxResults: number;
}

export const DEFAULT_IDENTIFY_OPTIONS: IdentifyOptions = { maxResults: 8 };

function soundingPitchClasses(frets: (number | null)[], tuning: Tuning): Set<number> {
  const set = new Set<number>();
  frets.forEach((fret, i) => {
    if (fret === null || fret === undefined || tuning[i] === undefined) return;
    set.add(mod12(tuning[i] + fret));
  });
  return set;
}

function bassPitchClass(frets: (number | null)[], tuning: Tuning): number | null {
  for (let i = 0; i < frets.length; i++) {
    const fret = frets[i];
    if (fret !== null && fret !== undefined && tuning[i] !== undefined) {
      return mod12(tuning[i] + fret);
    }
  }
  return null;
}

/**
 * Identify what chord a fretted shape is, trying every (root, quality, sus,
 * extension) combination and keeping the ones where the shape's sounding
 * notes are consistent with that chord: every required tone is present, and
 * nothing foreign is played. Ranks matches by whether the lowest-sounding
 * string is that chord's root (the strongest real-world cue), how tightly
 * the played notes match (no unplayed optional color tones left dangling),
 * and simplicity, so genuinely ambiguous shapes (e.g. a 4-note set that's
 * simultaneously a valid Am7 and a valid C6) resolve sensibly by bass note.
 */
export function identifyChord(
  frets: (number | null)[],
  tuning: Tuning,
  options: IdentifyOptions = DEFAULT_IDENTIFY_OPTIONS,
): ChordMatch[] {
  const played = soundingPitchClasses(frets, tuning);
  if (played.size < 2) return [];
  const bassPc = bassPitchClass(frets, tuning);

  const matches: ChordMatch[] = [];

  for (const root of CHROMATIC_ROOTS_FOR_DISPLAY) {
    for (const q of QUALITY_OPTIONS) {
      for (const s of SUS_OPTIONS) {
        for (const e of EXTENSION_OPTIONS) {
          if (DIMINISHED_ONLY_EXTENSIONS.includes(e.value) && q.value !== "diminished") {
            continue;
          }

          const chord = buildChord(root, q.value, s.value, e.value);
          const tonePcs = new Set(chord.tones.map((t) => t.pitchClass));
          const requiredPcs = new Set(
            chord.tones.filter((t) => t.required).map((t) => t.pitchClass),
          );

          let matchesRequired = true;
          for (const pc of requiredPcs) {
            if (!played.has(pc)) {
              matchesRequired = false;
              break;
            }
          }
          if (!matchesRequired) continue;

          let noForeignNotes = true;
          for (const pc of played) {
            if (!tonePcs.has(pc)) {
              noForeignNotes = false;
              break;
            }
          }
          if (!noForeignNotes) continue;

          const bassIsRoot = bassPc !== null && bassPc === pitchClass(root);
          const exact = played.size === tonePcs.size;
          const danglingOptional = played.size - requiredPcs.size;
          const complexity = Math.max(0, chord.tones.length - 3);

          const score =
            (bassIsRoot ? 20 : 0) + (exact ? 6 : 0) - danglingOptional * 2 - complexity;

          matches.push({ chord, bassIsRoot, exact, score });
        }
      }
    }
  }

  matches.sort((a, b) => b.score - a.score);

  // Structurally-valid-but-contrived readings (e.g. reading a plain C major
  // triad as a "G6sus4" with an unplayed 5th) otherwise pad out the list
  // whenever there aren't many genuine alternates. Keep only matches that
  // are reasonably close to the best one, falling back to the single best
  // match if even that scores poorly (still better than hiding it).
  const topScore = matches[0]?.score ?? 0;
  const strong = matches.filter((m) => m.score > 0 && topScore - m.score <= 10);
  const kept = strong.length > 0 ? strong : matches.slice(0, 1);

  return kept.slice(0, options.maxResults);
}

/**
 * Build a ChordShape-compatible object for an arbitrary fretted shape under
 * a given chord interpretation, so the shape the user actually entered can
 * be rendered with the same fretboard diagram component used elsewhere.
 */
export function shapeFromFrets(
  chord: Chord,
  frets: (number | null)[],
  tuning: Tuning,
): ChordShape {
  const toneByPitchClass = toneByPitchClassMap(chord);

  const toneIndices: (number | null)[] = frets.map((fret, i) => {
    if (fret === null || fret === undefined || tuning[i] === undefined) return null;
    const pc = mod12(tuning[i] + fret);
    return toneByPitchClass.get(pc) ?? null;
  });

  const frettedFrets = frets.filter(
    (f): f is number => typeof f === "number" && f > 0,
  );
  const minFret = frettedFrets.length ? Math.min(...frettedFrets) : 0;
  const maxFret = frettedFrets.length ? Math.max(...frettedFrets) : 0;
  const soundingStrings = frets.filter((f) => f !== null && f !== undefined).length;
  const { fingerCount, barreFret, barreStrings } = countFingers(frets);

  return {
    frets: [...frets],
    toneIndices,
    minFret,
    maxFret,
    soundingStrings,
    fingerCount,
    barreFret,
    barreStrings,
    score: 0,
  };
}

